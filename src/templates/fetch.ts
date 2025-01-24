import ejs from 'ejs';
import {TemplateVariables} from "../type";

const template = `<% if(hasAnyServices) { %>
import { FromDecoder } from "ts.data.json";
<% } %>

<%- protocOutput %>
<% services.forEach(service => { %>
<% service.methods.forEach(method => { %>
/*
<%= method.comment %>
*/
export async function <%= method.name %>(request: <%= method.requestType %>): Promise<FromDecoder<typeof <%= method.responseType %>Decoder> | {error: string;}> {
  try {
    const response = await fetch(\`http://localhost:8000<%= processURLPlaceholders(method.url, "request") %>\`, {
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

    return <%= method.responseType %>Decoder.decodeToPromise(await response.json());
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
    let hasAnyServices = false;
    for(let i = 0; i < data.services.length; i++) {
        if (data.services[i].methods.length) {
            hasAnyServices = true;
            break;
        }
    }

    return ejs.render(template, {
        ...data,
        hasAnyServices,
    });
};
