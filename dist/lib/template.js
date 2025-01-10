"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTemplateServices = toTemplateServices;
exports.toTemplateService = toTemplateService;
const optionNameToVerb = {
    "(google.api.http).get": "GET",
    "(google.api.http).post": "POST",
    "(google.api.http).put": "PUT",
    "(google.api.http).patch": "PATCH",
    "(google.api.http).delete": "DELETE",
};
function toTemplateServices(definition) {
    return definition.map(service => toTemplateService(service));
}
function toTemplateService(definition) {
    const result = {
        name: definition.name,
        methods: [],
    };
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
        });
        result.methods.push({
            name: method.name,
            requestType: method.requestType.value,
            responseType: method.responseType.value,
            url,
            verb,
            comment: method.comment,
        });
    });
    return result;
}
