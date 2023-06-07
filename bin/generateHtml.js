"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
function generate(items, toString) {
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

        html {
            width: 100%;
            height: 100%;
        }

        body {
            width: 100%;
            height: 100%;
            position: relative;
            background-color: rgb(236, 152, 42);
        }

        .center {
            width: 100%;
            height: 50%;
            margin: 0;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-family: "Trebuchet MS", Helvetica, sans-serif;
            text-align: center;
        }

        h1 {
            font-size: 144px;
        }

        p {
            font-size: 64px;
        }
    </style>
</head>
<body>
    <div class="center">
        <h1>Hello Again!</h1>
        <p>This is served from a file</p>
        ${items.map(toString).join('\n')}
    </div>
</body>

</html>`;
    return result;
}
exports.generate = generate;
//# sourceMappingURL=generateHtml.js.map