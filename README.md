# RoadMap

- Searched for multiple AI assistants available and below are the considerable AI assistants found.

## Similar Features available on all Assistants
- Explain, Refactor, Error Fix, Optimize, Comment to code

- 🐞 Test case for functions

- 💬 Chat Interface to chat with bot

## Interesting Features - Non-trivial ones
- 📝 Code Auto-completion
- 

## AI Assistents Researched 🤖

- ### Amazon Q

- ### Co-Pilot

- ### Code-GPT

- ### BlackBox

- ### Codeium

- ### Cody

## [Amazon Q](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.amazon-q-vscode)

- It has simple implementation for the code explain, bug details and bug fixing. It shows the hint box when hover over the error, it will give the options for that.

  ![AmazonQHintBox](https://github.com/aws/aws-toolkit-vscode/raw/HEAD/docs/marketplace/vscode/amazonq/security-scan.gif)

- It can able to provide code directly in the file. And it also provides a feature which gives structure of our codebase and letting to choose file where we need to put the code.

  ![AmzonQFileOption](https://github.com/aws/aws-toolkit-vscode/raw/HEAD/docs/marketplace/vscode/amazonq/dev.gif)

## [Co-Pilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)

- It lets the user to write the comment which describes the function they needed. By passing the comment as prompt to LLM and make auto-complete ( by pressing `tab` ) to create a code in the file itself.
  ![CopilotComment2Code](https://user-images.githubusercontent.com/37570492/212965036-26579d9f-cfaf-44eb-90fb-76421dc7ab9d.gif)

## [Code-GPT](https://marketplace.visualstudio.com/items?itemName=DanielSanMedium.dscodegpt)

- It has multiple AI model support. It lets user to choose the model. And also user can use their own account API key for the model also.

  ![CodeGPTAIAssistantsDemo](https://github.com/davila7/code-gpt-docs/assets/6216945/619e296e-fa40-4034-a91c-37c55bddf7d8)

- It has the picture upload feature. When we upload a interface it can analyse the picture and give as React Component code.

  ![CodeGPTImgUpload](https://github.com/davila7/code-gpt-docs/assets/6216945/c8b92f8b-98ef-496c-9f5a-835a8c09ffdd)

- It gives more options when we select a code snippet and do right click on that.

  ![CodeGPTMoreOptions](https://user-images.githubusercontent.com/6216945/229001324-02a44765-d98a-4bfb-91e4-85181e6aabb7.gif)

## [BlackBox](https://marketplace.visualstudio.com/items?itemName=Blackboxapp.blackbox)

- It provides a shortcut like in the bottom panel to do some operation in the currently opened editor.

  ![BlackBoxShortcut](https://storage.googleapis.com/a1aa/uploads/demo-command-comment.gif)

- It gives commit message for the changed code.

  ![BlackBoxCommentMessage](https://storage.googleapis.com/a1aa/uploads/demo-autocommit.gif)

- It has code suggestions shown in the end of the code we have. By clicking it, it gives the code that can be added after that.

## [Codeium](https://marketplace.visualstudio.com/items?itemName=Codeium.codeium)

- It also provides code based on the comment.

  ![CodeiumComment2Code](https://exafunction.github.io/public/autocomplete/minimize_boilerplate.gif)

- It explains the code by clicking the hint given above every function.

  ![CodeiumExplain](https://exafunction.github.io/public/chat/chat_explain_function_python.gif)

- It also has the refractor function which fixes the bug ,optimize the code just by clicking and providing what we want.

  ![CodeiumRefactor](https://exafunction.github.io/public/chat/chat_refactor_fix_todos.gif)

- It can also translates the code to different languages.

  ![CodeiumTranslate](https://exafunction.github.io/public/chat/chat_refactor_js_to_ts.gif)

## [Cody](https://marketplace.visualstudio.com/items?itemName=sourcegraph.cody-ai)

- It gives us the option to create our own command to execute operation. Below is the json format to add out own extension.

```json
{
  "commit-message": {
    "description": "Commit message for current changes",
    "prompt": "Suggest an informative commit message by summarizing code changes from the shared command output. The commit message should follow the conventional commit format and provide meaningful context for future readers.",
    "context": {
      "selection": false,
      "command": "git diff --cached"
    }
  }
}
```

you can have a better understanding from [here](https://sourcegraph.com/docs/cody/capabilities/commands#custom-commands).

- It gives a feature to search the function or components in the source folder in all files by searching it in natural language.

  ![CodySearch](https://storage.googleapis.com/sourcegraph-assets/blog/vs-code-onboarding-walkthrough-dec-2023-natural-language.gif)


## Getting started with development
- Clone the `adding_simple_feature` branch in your local.
- run `npm i` in the cli.
- press `F5`, a vscode window with our extension included will open.
- On the activity bar there will double check icon, by clicking it, the chat interface will be opened.
- For changing the theme color you can change the `root` color mentioned in the `styles.css` file.
