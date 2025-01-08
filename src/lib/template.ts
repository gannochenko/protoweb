import {TemplateMethod} from "../type";
import {ServiceDefinition} from "./proto";

const optionNameToVerb: Record<string, string> = {
    "(google.api.http).get": "GET",
    "(google.api.http).post": "POST",
    "(google.api.http).put": "PUT",
    "(google.api.http).patch": "PATCH",
    "(google.api.http).delete": "DELETE",
};

export function toTemplateService(definition: ServiceDefinition): TemplateMethod[] {
    const result: TemplateMethod[] = [];

    Object.keys(definition.methods).forEach(methodName => {
        const method = definition.methods[methodName];

        let verb = "";
        let url = "";

        Object.keys(method.options).forEach((key) => {
            const value = method.options[key];
            if (optionNameToVerb[key]) {
                verb = optionNameToVerb[key];
                url = value;
            }
        })

        result.push({
            name: method.name,
            requestType: method.requestType.value,
            responseType: method.responseType.value,
            url,
            verb,
            comment: method.comment,
        });
    })

    return result;
}
