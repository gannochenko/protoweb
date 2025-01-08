import ejs from 'ejs';
import {TemplateVariables} from "../type";

const template = `import { fetchWithRetry, ErrorResponse, apiUrl } from "../../../util/fetch";
// This is an alternative template

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

export const renderTemplate = (data: TemplateVariables): string => {
    return ejs.render(template, data);
};
