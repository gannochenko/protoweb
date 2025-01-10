const ejs = require('ejs');

// CommonJS template

const template = `import { ErrorResponse, apiUrl } from "../../../util/fetch";

<%- protocOutput %>
<% services[0].methods.forEach(method => { %>
/*
<%= method.comment %>
*/
export async function <%= method.name %>(request: <%= method.requestType %>): Promise<<%= method.responseType %> | ErrorResponse> {
  try {
    const response = await fetch(\`$\{apiUrl\}<%= method.url %>\`, {
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

module.exports = {
    renderTemplate: (data) => {
        return ejs.render(template, data);
    },
};
