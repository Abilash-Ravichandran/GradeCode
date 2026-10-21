// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import * as utils from "./utils";

let chatInterface: vscode.WebviewView | undefined;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

  vscode.window.showInformationMessage("Grade code extension is active now!!")
  let chatInterfaceView = vscode.window.registerWebviewViewProvider("grade-code", {
    async resolveWebviewView(webviewView: vscode.WebviewView) {
      chatInterface = webviewView;
      const webview = webviewView.webview;

      // Get the local paths to HTML, CSS, and JavaScript files
      const cssMainPath = vscode.Uri.joinPath(
        context.extensionUri,
        "src",
        "ui",
        "styles.css"
      );
      const jsPath = vscode.Uri.joinPath(
        context.extensionUri,
        "src",
        "ui",
        "script.js"
      );
      const codiconsPath = vscode.Uri.joinPath(
        context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      );
      const highlightjsPath = vscode.Uri.joinPath(
        context.extensionUri,
        "node_modules",
        "highlight.js",
        "styles",
        "github-dark.css"
      );

      // Convert local paths to webview URIs
      const cssMainUri = webview.asWebviewUri(cssMainPath);
      const jsUri = webview.asWebviewUri(jsPath);
      const codiconsUri = webview.asWebviewUri(codiconsPath);
      const highlightjsUri = webview.asWebviewUri(highlightjsPath);
      const nonce = utils.getNonce();

      webview.html = `
		        <!DOCTYPE html>
        		<html lang="en">
            		<head>
            			<meta charset="UTF-8">
            			<meta name="viewport" content="width=device-width, initial-scale=1.0">
            			<title>Chat Interface</title>
            			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src 'self' vscode-resource: data:; img-src 'self' vscode-resource:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            			<link href="${cssMainUri}" rel="stylesheet">
            			<link href="${codiconsUri}" rel="stylesheet"/>
                  <link href="${highlightjsUri}" rel="stylesheet"/>
        			</head>
            		<body>
                	<div class="chat-container" id="messages"></div>
            			<div class="input-container">
                    <i id="uploadButton" class="codicon codicon-add"></i>
                		<textarea id="inputBox" rows="10" cols="50" placeholder="Type a message..."></textarea>
                		<button id="sendButton"><i class="codicon codicon-send"></i></button>
            			</div>
            			<script nonce="${nonce}" src="${jsUri}"></script>
        			</body>
        		</html>
		`;

      webviewView.webview.onDidReceiveMessage(async (data) => {
        let userPrompt = data.userPrompt;
        let command = data.command;
        switch (command) {
          case "upload":
            
            let resMsg = await utils.evaluateAndGrade();
            const htmlResponse = utils.getHtmlContent(resMsg as string);
            let rootPath = utils.getRootFolderPath();
            let content = `${await utils.getFilesContent(rootPath)}`;
            // utils.showInDocument(content);
            webview.postMessage({
              prompt: htmlResponse,
              command: "htmlContent",
            });
            break;
          // case "upload":
          //   const markdownContent = await getMarkdownContent();
          //   const htmlContent = getHtmlContent(markdownContent);
          //   webview.postMessage({
          //     prompt: htmlContent,
          //     command: "htmlContent",
          //   });
          //   break;
          default:
            const botReply = await utils.getApiResponse(userPrompt);
            const botResponse = utils.getHtmlContent(botReply as string);
            webview.postMessage({
              prompt: botResponse,
              command: "htmlContent",
            });
            break;
        }
        // const openedEditor = vscode.window.activeTextEditor;
        // const selectedContent = getSelectedContent(openedEditor);
        // webview.postMessage({ prompt: selectedContent });
      });
      webview.options = {
        enableScripts: true,
      };
    },
  });

  context.subscriptions.push(chatInterfaceView);

  const onDidChangeCodeLensesEvent = new vscode.EventEmitter<void>();
  let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    "*",
    utils.getCodeLensProvider()
  );

  // Register the initial CodeLens provider
  context.subscriptions.push(codeLensProviderDisposable);

  // Register the settings ui
  

  // Listen for selection changes and refresh CodeLens
  vscode.window.onDidChangeTextEditorSelection((event) => {
    // Ensure the event is for the active editor
    if (event.textEditor === vscode.window.activeTextEditor) {
      // Dispose of the current CodeLens provider and register a new one
      codeLensProviderDisposable.dispose();
      codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
        "*",
        utils.getCodeLensProvider()
      );
      context.subscriptions.push(codeLensProviderDisposable);
      onDidChangeCodeLensesEvent.fire();
    }
  });

  // Register commands for CodeLens actions
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.explainCommand",
      async (document: vscode.TextDocument, selectedText: vscode.Selection) => {
        if (chatInterface) {
          chatInterface.webview.postMessage({
            prompt: `${selectedText}\nExplain this code`,
            command: "setInput",
          });
        }
        // vscode.window.showInformationMessage("Explain command clicked!");
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
