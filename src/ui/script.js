const vscode = acquireVsCodeApi();

const messageElements = document.getElementById("messages");
const inputBox = document.getElementById("inputBox");
const sendButton = document.getElementById("sendButton");
let loadingContainer;

function loadAnimation(load) {
  if (load) {
    // Create the loading container
    loadingContainer = document.createElement("div");
    loadingContainer.setAttribute("class", "bot-message loading-container");
    // Create the loading bubbles and append them to the container
    for (let i = 0; i < 3; i++) {
      const loadingBubble = document.createElement("div");
      loadingBubble.classList.add("loading-bubble");
      loadingContainer.appendChild(loadingBubble);
    }
    messageElements.appendChild(loadingContainer);
  } else {
    if (loadingContainer) {
      loadingContainer.remove();
    }
  }
}

function appendMessage(message, isUser, command) {
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container");
  const messageContent = document.createElement("div");
  messageContent.classList.add("message");
  // Create circular container for profile icon
  const profileIcon = document.createElement("div");
  messageContainer.appendChild(profileIcon);

  if (isUser) {
    profileIcon.classList.add("profile-icon", "user-profile-icon");
    messageContainer.classList.add("user-message");
    messageContent.textContent = message;
  } else {
    setTimeout(() => {
      loadAnimation(false);
      profileIcon.classList.add("profile-icon", "bot-profile-icon");
      messageContainer.classList.add("bot-message");
      if (command === "htmlContent") {
        messageContent.innerHTML = message;
      } else {
        messageContent.textContent = message;
      }
      messageElements.scrollTop = messageElements.scrollHeight;
    }, 2000);
  }
  messageContainer.appendChild(messageContent);
  messageElements.appendChild(messageContainer);
  messageElements.scrollTop = messageElements.scrollHeight;
}

function sendMessage() {
  const message = inputBox.value;
  let command;
  if (message.startsWith("/Grade")) {
    command = "grade";
  }
  appendMessage(message, true);
  loadAnimation(true);
  vscode.postMessage({ userPrompt: message, command: command });
  inputBox.value = "";
}

document.getElementById("uploadButton").addEventListener("click", () => {
  vscode.postMessage({ command: "upload" });
  loadAnimation(true);
});

inputBox.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);

window.addEventListener("message", (event) => {
  const data = event.data;
  let message = data.prompt;
  let command = data.command;
  if (command === "setInput") {
    inputBox.value = message;
  } else {
    appendMessage(message, false, command);
  }
});
