import ejs from 'ejs';
import {TemplateVariables} from "../type";

const template = `<%- protocOutput %>

<% if(hasAnyServices) { %>
type DeepNonUndefined<T> = T extends object
? {
  [K in keyof T]: DeepNonUndefined<Exclude<T[K], undefined>>;
}
: T;

type DeepReplaceDateWithNullable<T> = T extends Date
  ? Date | null // Replace Date with Date | null
  : T extends object // Check if it's an object or array
  ? {
      [K in keyof T]: DeepReplaceDateWithNullable<T[K]>; // Recursively apply to properties
    }
  : T;
<% } %>

<% services.forEach(service => { %>
<% service.methods.forEach(method => { %>
/*
<%= method.comment %>
*/
export async function <%= method.name %>(request: <%= method.requestType %>): Promise<DeepReplaceDateWithNullable<DeepNonUndefined<<%= method.responseType %>>> | {error: string;}> {
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
    
    const data = await response.json();
    await <%= method.responseType %>Decoder.decodeToPromise(data);

    return data as DeepReplaceDateWithNullable<DeepNonUndefined<<%= method.responseType %>>>;
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
