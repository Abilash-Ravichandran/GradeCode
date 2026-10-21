import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import pdf from "pdf-parse";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { makeChatAPICall as openAIChat } from "./api";

function readGitignore(gitignorePath: string = ".gitignore"): string[] {
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  }
  return [];
}

function patternToRegex(pattern: string): RegExp {
  // Escape special characters for regex
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".")
    .replace(/\/$/, "(/.*)?");

  // Handle negation pattern
  if (pattern.startsWith("!")) {
    regexStr = `^((?!${regexStr.substring(1)}).)*$`;
  } else {
    regexStr = `^${regexStr}$`;
  }

  return new RegExp(regexStr);
}

function isIgnored(filePath: string, patterns: string[]): boolean {
  let rootPath = getRootFolderPath();
  const relativePath = path
    .relative(rootPath || "", filePath)
    .replace(/\\/g, "/"); // Normalize for Windows
  for (const pattern of patterns) {
    const regex = patternToRegex(pattern);
    if (regex.test(relativePath)) {
      return true;
    }
  }
  return false;
}
export async function getFilesContent(
  rootPath: string | undefined
): Promise<string[]> {
  let gitignorePath;
  if (rootPath) {
    gitignorePath = path.join(rootPath, ".gitignore");
  }
  const ignorePatterns = readGitignore(gitignorePath);
  ignorePatterns.push("node_modules/");
  ignorePatterns.push(".next/");
  let fileContent: string[] = [];

  async function readDirectory(directory: string | undefined) {
    if (directory) {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        const filePath = path.join(directory, file);
        const fileName = path.basename(filePath);

        if (isIgnored(filePath, ignorePatterns)) {
          continue;
        }
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          const directoryContent = await getFilesContent(filePath);
          fileContent = fileContent.concat(directoryContent);
        } else if (stats.isFile()) {
          if (
            fileName.match(
              /\.(js|ts|tsx|css|py|java|c|cpp|rb|go|php|swift|md)$/
            )
          ) {
            const content = fs.readFileSync(filePath, "utf-8");
            fileContent.push(`\`\`\`\n${content}\n\`\`\``);
          }
        }
      }
    }
  }

  await readDirectory(rootPath);
  return fileContent;
}

export async function evaluateAndGrade(): Promise<String | undefined> {
  const { llmModel, apiKey, aspects, total } = getConfiguration();
  if (total !== 100) {
    return vscode.window.showErrorMessage(
      `The total aspect values must be equal to 100%. Current total is ${total}%. Please adjust the values in the settings.`,
      { modal: true }
    );
  } else {
    let testing = false;
    let roothPath = getRootFolderPath();
    if (testing) {
      return "Test **response** for _grading_";
    } else {
      let userRequirement = await getUserRequirement();
      let evaluationMatrix = getEvaluationMatrix(aspects);
      let filesContents = await getFilesContent(roothPath);
      const prompt = `${filesContents}
     ${evaluationMatrix}
     ${userRequirement}`;
      return getApiResponse(prompt);
    }
  }
}

export async function getApiResponse(
  prompt: string,
  requirement: string = ""
): Promise<String> {
  let apiResponse: String = `${prompt}.The output must be in a markdown format.`;
  let { llmModel, apiKey, aspects, total } = getConfiguration();
  // let llmModel = config.llmModel;
  // let apiKey = config.apiKey;
  try {
    apiResponse = await openAIChat(prompt, requirement, llmModel, apiKey);
  } catch (error) {
    console.log(error);
    apiResponse = "Something went wrong while calling OpenAI API";
  }
  return apiResponse;
}

async function getUserRequirement() {
  try {
    const open = await openDialog(
      "dialog",
      "Select the file which contains your requirement!"
    );
    if (!open) {
      try {
        const file = await openDialog("getfile", undefined);
        if (file) {
          const filePath = file.fsPath;
          const fileExtension = getFileExtension(filePath);
          if (fileExtension === "pdf") {
            return readPdfFile(filePath);
          } else if (fileExtension === "txt") {
            return readFile(file);
          } else {
            vscode.window.showErrorMessage("Unsupported file Type");
          }
        } else {
          throw new Error("No file selected");
        }
      } catch (error) {
        console.error("Error getting user requirement:", error);
        throw error;
      }
    }
  } catch (error) {
    console.log("Error appeared while getting user requirement: ", error);
  }
}

export function getRootFolderPath(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("No workfolder found");
    // return undefined;
  }
}

async function openDialog(dialogType: string, message: string | undefined) {
  if (!message) {
    message = "";
  }
  switch (dialogType) {
    case "dialog":
      vscode.window.showInformationMessage(message, { modal: true });
      return undefined;
    case "getfile":
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: "Select File",
        filters: {
          "Text and PDF Files": ["txt", "pdf"],
          "Text Files": ["txt"],
          "PDF Files": ["pdf"],
        },
      };

      const fileUri = await vscode.window.showOpenDialog(options);

      if (fileUri && fileUri[0]) {
        return fileUri[0]; // Return the selected file URI
      } else {
        vscode.window.showInformationMessage("No file selected");
        return undefined; // Return undefined if no file was selected
      }
    default:
      vscode.window.showInformationMessage(message);
  }
}

async function readFile(filePath: vscode.Uri): Promise<string> {
  try {
    // Read the file using workspace.fs.readFile
    const fileContentBuffer = await vscode.workspace.openTextDocument(filePath);
    const fileContent = fileContentBuffer.getText();
    return fileContent;
  } catch (error) {
    throw new Error(`Error reading file: ${error}`);
  }
}

async function readPdfFile(pdfPath: string) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const data = await pdf(pdfBytes);
    const text = data.text;
    return text;
  } catch (error) {
    vscode.window.showErrorMessage(
      "Error reading PDF file: " + (error as Error).message
    );
  }
}

function getFileExtension(filePath: string) {
  return filePath.split(".").pop()?.toLowerCase() || "";
}

function getEvaluationMatrix(aspects: {
  functionalCompletion: number;
  nonFunctionalAspects: number;
  namingConvention: number;
  designPatterns: number;
  bestPractices: number;
  errorHandling: number;
  languageConstructs: number;
  codeComments: number;
  deadCode: number;
  positiveTests: number;
  negativeTests: number;
  coverage: number;
  readme: number;
}) {
  return `Grade the assignment submission files based on the functional requirements mentioned below. "think step by step". The grading MUST be on a scale of 1 to 10, 1 being the minimum and 10 being the maximum.
Consider the following aspects and their respective weightage percentages when grading:
Functional requirement completion =	${aspects.functionalCompletion}%
Non Functional aspects = ${aspects.nonFunctionalAspects}%
Naming Convention = ${aspects.namingConvention}%
Usage of Design Patterns = ${aspects.designPatterns}%
Programming Best Practices = ${aspects.bestPractices}%
Error Handling = ${aspects.errorHandling}%
Leveraging language constructs = ${aspects.languageConstructs}%
Code comments = ${aspects.codeComments}%
No dead code or unnecessary code and unnecessary dependencies = ${aspects.deadCode}%
Positive Unit Test Cases = ${aspects.positiveTests}%
Negative Unit Test Cases = ${aspects.negativeTests}%
Coverage = ${aspects.coverage}%
ReadME = ${aspects.readme}%
Total	100%
Give the overall score for the entire assignment and Ensure to provide detailed positive and negative feedback and justification for the grade assigned. Remember to mention any areas of improvement or suggestions.
## Functional Requirements: `;
}

export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function getMarkdownContent() {
  const options: vscode.OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select the markdown file",
    filters: {
      "Markdown Files": ["md"],
    },
  };
  const fileUri = await vscode.window.showOpenDialog(options);
  if (fileUri && fileUri[0]) {
    const filePath = fileUri[0];
    const fileContentBuffer = await vscode.workspace.openTextDocument(filePath);
    const fileContent = fileContentBuffer.getText();
    return fileContent;
  } else {
    vscode.window.showErrorMessage("No file selected!");
    return undefined;
  }
}

export function getHtmlContent(markdownContent: string | undefined) {
  if (!markdownContent) {
    return "ooops!! something went wrong!";
  } else {
    const markedOptions = markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang, info) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    });
    const marked = new Marked(markedOptions as any);

    return marked.parse(markdownContent);
  }
}
export function getSelectedContent(
  openedEditor: vscode.TextEditor | undefined
) {
  const currentDocument = openedEditor?.document;
  const selectedContent = openedEditor?.selection;
  const selectedPart = currentDocument?.getText(selectedContent);
  return selectedPart;
}

export function generateMarkdownContent(selectedText: string | undefined) {
  if (!selectedText) {
    return "";
  }
  const markdownContent = new vscode.MarkdownString();
  markdownContent.appendText(`**Selected text: **\n`);
  markdownContent.appendCodeblock(selectedText, "plaintext");
  markdownContent.appendMarkdown("\n\n[Option 1](command:extension.option1)\n");
  markdownContent.appendMarkdown("[Option 2](command:extension.option2)\n");
  return markdownContent;
}

export function getCodeLensProvider(): vscode.CodeLensProvider {
  return {
    provideCodeLenses(
      document: vscode.TextDocument,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeLens[]> {
      const codeLenses: vscode.CodeLens[] = [];
      const activeEditor = vscode.window.activeTextEditor;

      // Ensure we have an active editor and the document matches
      if (activeEditor && activeEditor.document === document) {
        // Iterate through each selection
        activeEditor.selections.forEach((selection) => {
          // Calculate the position just below the selected content
          const rangeBelowSelection = new vscode.Range(
            selection.end.line + 1,
            0,
            selection.end.line + 1,
            0
          );
          const selectedText = document.getText(selection);
          let cmd = {
            title: "Explain",
            command: "extension.explainCommand",
            tooltip: "Explains this code",
            arguments: [document, selectedText],
          };
          const codeLens = new vscode.CodeLens(rangeBelowSelection, cmd);
          codeLenses.push(codeLens);
        });
      }

      return codeLenses;
    },
  };
}

export async function showInDocument(resMsg: string | string[]) {
  // Create a URI for the new document
  const uri = vscode.Uri.parse("untitled:" + "content.txt");

  // // Open the document
  const document = await vscode.workspace.openTextDocument(uri);

  // // Get the editor for the opened document
  const editor = await vscode.window.showTextDocument(document);

  // // Edit the content of the document
  await editor.edit((editBuilder) => {
    const start = new vscode.Position(0, 0);
    const end = new vscode.Position(editor.document.lineCount + 1, 0);
    const range = new vscode.Range(start, end);
    editBuilder.replace(range, resMsg as string);
  });
}

export function getConfiguration() {
  const config = vscode.workspace.getConfiguration("gradecode");
  const llmModel = config.get<string>("llmModel");
  const apiKey = config.get<string>("apiKey");
  // Retrieve the aspect values
  const functionalCompletion =
    config.get<number>("requirements.functionalCompletion") ?? 0;
  const nonFunctionalAspects =
    config.get<number>("requirements.nonFunctionalAspects") ?? 0;
  const namingConvention =
    config.get<number>("codingAspects.namingConvention") ?? 0;
  const designPatterns =
    config.get<number>("codingAspects.designPatterns") ?? 0;
  const bestPractices = config.get<number>("codingAspects.bestPractices") ?? 0;
  const errorHandling = config.get<number>("codingAspects.errorHandling") ?? 0;
  const languageConstructs =
    config.get<number>("codingAspects.languageConstructs") ?? 0;
  const codeComments = config.get<number>("codingAspects.codeComments") ?? 0;
  const deadCode = config.get<number>("codingAspects.deadCode") ?? 0;
  const positiveTests = config.get<number>("unitTestCases.positiveTests") ?? 0;
  const negativeTests = config.get<number>("unitTestCases.negativeTests") ?? 0;
  const coverage = config.get<number>("unitTestCases.coverage") ?? 0;
  const readme = config.get<number>("others.readme") ?? 0;
  const total =
    functionalCompletion +
    nonFunctionalAspects +
    namingConvention +
    designPatterns +
    bestPractices +
    errorHandling +
    languageConstructs +
    codeComments +
    deadCode +
    positiveTests +
    negativeTests +
    coverage +
    readme;
  const aspects = {
    functionalCompletion,
    nonFunctionalAspects,
    namingConvention,
    designPatterns,
    bestPractices,
    errorHandling,
    languageConstructs,
    codeComments,
    deadCode,
    positiveTests,
    negativeTests,
    coverage,
    readme,
  };

  return { llmModel, apiKey, aspects, total };
}
