"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function generateHome(items, mapper) {
    var mapResults = Object.entries(items).map(function (_a) {
        var key = _a[0], value = _a[1];
        return mapper(key, value);
    });
    var result = "<!DOCTYPE html>\n<head>\n    <title>Module Federation Start</title>\n    <style>\n        *,\n        html {\n            margin: 0;\n            padding: 0;\n            border: 0;\n        }\n\n        html {\n            width: 100%;\n            height: 100%;\n        }\n\n        body {\n            width: 100%;\n            height: 100%;\n            position: relative;\n        }\n\n        .title {\n            width: 100%;\n            background-color: rgb(236, 152, 42);\n            transform: translate(-50%, -50%);\n            color: white;\n            font-family: \"Trebuchet MS\", Helvetica, sans-serif;\n            text-align: center;\n        }\n\n        .center {\n            display: flex;\n            flex-direction: column;\n            justify-content: center;\n            align-items: center;\n        }\n\n        h1 {\n            font-size: 40px;\n        }\n\n        p {\n            font-size: 12px;\n        }\n    </style>\n    <script>\n    ".concat(mapResults.map(function (items) { return items.script; }), "\n    </script>\n</head>\n<body>\n    <div class=\"center\">\n    <div class=\"title\"><h1>Module federation remotes listener</h1></div>\n        \n        ").concat(mapResults.map(function (items) { return items.html; }), "\n    </div>\n</body>\n\n</html>");
    return result;
};
//# sourceMappingURL=generateHtml.js.map