interface Remote {
  moduleName: string;
  remoteUrl: string;
  bonjourName?: string;
  localPath?: string;
  localCommand?: string;
}

/**
 * Generates the home page at the root url
 * @param items remote module dependencies
 * @returns
 */
export function generateHome(items: { [key: string]: Remote }) {
  const result = `<!DOCTYPE html>
    <head>
    <title>Module Federation Start</title>
    <style>
    *,
    html {
      margin: 0;
      padding: 0;
      border: 0;
    }
    div {
      display: flex;
      flex-direction: column;
    }
    html {
      width: 100%;
      height: 100%;
    }
    body {
      width: 100%;
      height: 100%;
      position: relative;
      font-family: "Trebuchet MS", Helvetica, sans-serif;
      display: flex;
      justify-content: center;
    }
    .title {
      width: 100%;
      background-color: rgb(236, 152, 42);
      color: white;
      text-align: center;
      align-items: center;
    }
    .center {
      max-width: 1000px;
      width: 100%;
    }
    .remote {
      background-color: #eee;
      border-radius: 5px;
      padding: 10px;
      margin: 10px;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
    .tag {
      border-radius: 50vh;
      margin-left: 5px;
      margin-right: auto;
      padding-inline: 5px;
      color: white;
      font-weight: bold;
    }
    .offline {
      background-color: #DDD;
    }
    .error {
      background-color: #DB4437;
    }
    .healthy {
      background-color: #0F9D58;
    }
    h1 {
      font-size: 40px;
      margin: 10px;
    }
    h2 {
      font-size: 24px;
      margin: 10px;
    }
    p {
      font-size: 12px;
      margin: 10px;
    }
    </style>
    <script>
    
    listenChanges();
    const socket = new WebSocket(
      "ws://localhost:8080"
    );
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      for (const [key, value] of Object.entries(data)) {
        const element = document.getElementById(key + "-status");
        element.innerText = "live @ " + value;
        element.classList = "tag healthy";
      }
    }
    function changeSource(module, source) {
      socket.send(JSON.stringify({module, source}));
    }
    function listenChanges() {
      // fetch("")
      console.log("fetching")
      // setTimeout(listenChanges, 500);
    }
    socket.onopen = () => console.log("ws connected")
    </script>
    </head>
    <body>
    <div class="center">
    <div class="title"><h1>Module federation remotes listener</h1></div>
    <h2>Remote modules</h2>
    ${Object.entries(items)
      .map(([key, value], index) => {
        return `<div class="remote"><strong class="module-name">${value.moduleName}</strong>
        <div class="tag offline" id="${value.moduleName}-status" name="${value.moduleName}-status">offline</div>
        <select name="${key}-source" id="${key}-source" onchange="changeSource('${value.moduleName}', this.value)">
        <option value="local" id="local">Local</option>
        <option value="remote" id="remote">Remote</option>
        </select>
        </div>`;
      })
      .join('')}
    </div>
    </body>
    </html>`;
  return result;
}
