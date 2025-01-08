"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = void 0;
const ejs_1 = __importDefault(require("ejs"));
const template = `import { fetchWithRetry, ErrorResponse, apiUrl } from "../../../util/fetch";

<%- protocOutput %>
<% methods.forEach(method => { %>
// <%= method.comment %>
export async function <%= method.name %>(request: <%= method.requestType %>): Promise<<%= method.responseType %> | ErrorResponse> {
  try {
    const response = await fetchWithRetry(\`$\{apiUrl\}<%= method.url %>\`, {
      method: "<%= method.verb %>",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        error: \`Status: $\{response.status\}\`,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      error: (error as Error).message,
    };
  }
}
<% }); %>
`;
const renderTemplate = (data) => {
    return ejs_1.default.render(template, data);
};
exports.renderTemplate = renderTemplate;
