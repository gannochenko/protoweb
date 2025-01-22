import ejs from 'ejs';
import {TemplateVariables} from "../type";

const template = `<% if(services.length) { %>
import { FromDecoder } from "ts.data.json";
import { fetchWithRetry, ErrorResponse, apiUrl } from "../../../util/fetch";
<% } %>

<%- protocOutput %>
<% services.forEach(service => { %>
<% service.methods.forEach(method => { %>
type <%= method.responseType %>FromDecoder = FromDecoder<typeof <%= method.responseType %>Decoder>;

/*
<%= method.comment %>
*/
export async function <%= method.name %>(request: <%= method.requestType %>): Promise<<%= method.responseType %>FromDecoder | ErrorResponse> {
  try {
    const response = await fetchWithRetry(\`$\{apiUrl\}<%= processURLPlaceholders(method.url, "request") %>\`, {
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

    return <%= method.requestType %>Decoder.decodeToPromise(await response.json());
  } catch (error) {
    return {
      error: (error as Error).message,
    };
  }
}
<% }); %>
<% }); %>
`;

export const renderTemplate = (data: TemplateVariables): string => {
    return ejs.render(template, data);
};
