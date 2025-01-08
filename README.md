<!-- PROJECT SHIELDS -->
<!--
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![Language][language-shield]][language-url]
[![LinkedIn][linkedin-shield]][linkedin-url]


<br />
<p align="center">
  <a href="https://github.com/gannochenko/protoweb">
    <img src="images/logo.jpg" alt="Logo" width="150" height="150">
  </a>

<h3 align="center">ProtoWeb</h3>

  <p align="center">
    Simply convert Protobuf definitions to Typescript
    <!--
    <br />
    <a href="https://github.com/gannochenko/protoweb"><strong>Explore the docs »</strong></a>
    -->
    <br />
    <br />
    <a href="https://github.com/gannochenko/protoweb/issues">Report Bug</a>
    ·
    <a href="https://github.com/gannochenko/protoweb/issues">Request Feature</a>
  </p>
</p>



## Table of Contents

- [About the Project](#about-the-project)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Installation to a Different Folder](#installation-to-a-different-folder)
    - [Upgrading](#upgrading)
- [Usage](#usage)
    - [Example](#example)
    - [Templating Mechanism](#templating-mechanism)
- [Commands](#commands)
- [Roadmap](#roadmap)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Built With](#built-with)
- [Contact](#contact)


## About The Project

<!--
[![Preview Screen Shot][product-screenshot]](https://example.com)
-->

`protoweb` is a tool for converting proto definitions into arbitrary JS/TS code that could be used in your organization.

[Protocol buffers](https://protobuf.dev/) is an industry standard when it comes to building direct service-to-service communication. However,
when used with the Google annotations extension to enable REST on-top of gRPC, it quickly becomes a hassle when running the thing in a front-end
project, such as React or Vue-based one. 

Engineers face two options:

* Write and maintain service definitions manually, or
* Use end-to-end solutions, such as [Connect.build](https://connectrpc.com/).

While Connect.build is a great tool, it's also the "all-or-nothing" solution, which means we can't use it partially and should
maintain full commitment instead. It turns into a problem in case when an organisation has, say, a custom implementation of `fetch` or
an SDK that entirely wraps the networking API in order to enable transparent JWT refreshing or retry mechanism.

This is where `Protoweb` comes to help: it converts messages to TS type definitions using `protoc` and [protoc-gen-ts](https://github.com/thesayyn/protoc-gen-ts), and then
flavours it with service definitions of your choice. These services can later be used in parts of the front-end app, for instance,
in connection with [react-query](https://tanstack.com/query/v4/docs/framework/react/overview).

Write your proto files once, then never write typescript.

## Getting Started

### Prerequisites

* [Node](https://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/)
* [Yarn](https://yarnpkg.com/lang/en/docs/install/#mac-stable) or NPM (comes with Node)
* [Protoc](https://grpc.io/docs/protoc-installation/)
* [Protoc-gen-ts](https://github.com/thesayyn/protoc-gen-ts)

### Installation

```sh
yarn global add @gannochenko/protoweb
```

### Installation to a different folder

To avoid problems with permissions and `sudo`, it is possible to install the package locally and then add it's folder to `PATH` variable.

1. Create `~/.node` folder
    ```sh
    mkdir ~/.node
    ```
2. Install the package
    ```sh
    yarn global add @gannochenko/protoweb --prefix ~/.node
    ```
3. Add `~/.node` folder to `PATH`
    ```sh
    export PATH=${PATH}:${HOME}/.node/bin
    ```
4. Add the command above to `~/.bashrc` (or `~/.bash_profile` in case of MacOS)

5. You should be able to run the `protoweb` CLI command now

#### Upgrading

If you followed the way how the installation was done, then do upgrading as following:
```sh
yarn global upgrade @gannochenko/protoweb --prefix ~/.node
```

## Usage

The generator needs three things:

* Full path to the folder where the protobuf definitions are kept.
* The template for a service file.
* The output path.

### Example

Let's say there is a protobuf definition stored in `~/someservice/protobuf`:

~~~
syntax = "proto3";

package someservice.image.v1;

option go_package = "backend/proto/v1/imagepb";

import "google/api/annotations/annotations.proto";
import "common/image/v1/image.proto";
import "common/page_navigation/v1/page_navigation.proto";

message ListImagesRequest {
  common.page_navigation.v1.PageNavigationRequest page_navigation = 1;
}

message ListImagesResponse {
  string version = 1;
  repeated common.image.v1.Image images = 2;
  common.page_navigation.v1.PageNavigationResponse page_navigation = 3;
}

service ImageService {
  rpc ListImages(ListImagesRequest) returns (ListImagesResponse) {
    option (google.api.http) = {
      post : "/v1/image/list"
      body : "*"
    };
  }
}
~~~

There is also a template `~/cool_service_template.js` defined using JavaScript (not TypeScript!):

~~~
const ejs = require('ejs');

const template = `import { ErrorResponse, apiUrl } from "../../../util/networking";

<%- protocOutput %>
<% methods.forEach(method => { %>
// <%= method.comment %>
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
~~~

We can then compile the definitions to `~/my-output`:

~~~
mkdir ~/my-output
protoweb build -i ~/someservice/protobuf -o ~/my-output -t ~/cool_service_template.js
~~~

The result will be:

~~~
import { ErrorResponse, apiUrl } from "../../../util/networking";

// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               v3.19.4
// source: image/v1/image.proto

/* eslint-disable */
import { type CreateImage, type Image } from "../../common/image/v1/image";
import {
  type PageNavigationRequest,
  type PageNavigationResponse,
} from "../../common/page_navigation/v1/page_navigation";

export const protobufPackage = "someservice.image.v1";

export interface ListImagesRequest {
  pageNavigation: PageNavigationRequest | undefined;
}

export interface ListImagesResponse {
  version: string;
  images: Image[];
  pageNavigation: PageNavigationResponse | undefined;
}

export interface ImageService {
  /** ListImages returns a list of user images, paginated and sorted by creation date */
  ListImages(request: ListImagesRequest): Promise<ListImagesResponse>;
}

// ListImages returns a list of user images, paginated and sorted by creation date
export async function ListImages(request: ListImagesRequest): Promise<ListImagesResponse | ErrorResponse> {
  try {
    const response = await fetch(`${apiUrl}/v1/image/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        error: `Status: ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      error: (error as Error).message,
    };
  }
}
~~~

Now use this file with react-hooks, easy.

### Templating mechanism

Protoweb uses [ejs](https://ejs.co/) as a template engine.

The custom template should export the `renderTemplate()` function that takes data as an argument
and returns a string.

The structure of data is the following:

~~~typescript
{
    protocOutput: string; // output produced by protoc, contains type definitions
    methods: { // methods parsed from the protobuf file
        name: string; // method name
        requestType: string; // name of the request type
        responseType: string; // name of the response type
        url: string; // url parsed from the google annotations
        verb: string; // HTTP verb parsed from the google annotations
        comment: string; // optional comment
    }[];
}
~~~

Note, that `protocOutput` must be present in the template file, and __should not be escaped__.

## Commands

<table width="100%">
    <thead>
        <tr>
            <th>Command</th>
            <th>Explanation</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><b>build</b></td>
            <td>
                Builds the definitions.<br />
                Parameters:
                <ul>
                    <li>-i &lt;path&gt; - input folder</li>
                    <li>-o &lt;path&gt; - output folder</li>
                    <li>-t &lt;template&gt; - template file</li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

Type `protoweb -h` to find out about all available commands.

## Roadmap

* Bugfixing :)
* Support for additional tooling such as JsonDecoder. This is a doable task, yet a tricky one: the Protobuf AST must be compiled into a schema of JsonDecoder, where there could be a lot of edge cases to cover.

See the [open issues](https://github.com/gannochenko/protoweb/issues) for a list of proposed features (and known issues).

### Development

1. Clone the repo
    ```sh
    git clone https://github.com/gannochenko/protoweb.git
    ```
2. Install NPM packages
    ```sh
    cd protoweb;
    yarn;
    yarn start build -i <folder> -o <folder>;
    ```

There is a built-in template that will be used should the -t option be missing.

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

### Built With

* [TypeScript](http://www.typescriptlang.org/)
* Protoc
* [Protoc-ts-gen](https://github.com/thesayyn/protoc-gen-ts)
* [Proto-parser](https://github.com/lancewuz/proto-parser)
* [Commander](https://www.npmjs.com/package/commander)
* [EJS](https://www.npmjs.com/package/ejs)

## Contact

Sergei Gannochenko - [Linkedin](https://www.linkedin.com/in/gannochenko/)

Project Link: [https://github.com/gannochenko/protoweb](https://github.com/gannochenko/protoweb)

<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/gannochenko/protoweb.svg?style=flat-square
[contributors-url]: https://github.com/gannochenko/protoweb/graphs/contributors
[language-shield]: https://img.shields.io/github/languages/top/gannochenko/protoweb.svg?style=flat-square
[language-url]: https://github.com/gannochenko/protoweb
[forks-shield]: https://img.shields.io/github/forks/gannochenko/protoweb.svg?style=flat-square
[forks-url]: https://github.com/gannochenko/protoweb/network/members
[stars-shield]: https://img.shields.io/github/stars/gannochenko/protoweb.svg?style=flat-square
[stars-url]: https://github.com/gannochenko/protoweb/stargazers
[issues-shield]: https://img.shields.io/github/issues/gannochenko/protoweb.svg?style=flat-square
[issues-url]: https://github.com/gannochenko/protoweb/issues
[license-shield]: https://img.shields.io/github/license/gannochenko/protoweb.svg?style=flat-square
[license-url]: https://github.com/gannochenko/protoweb/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/gannochenko/
[product-screenshot]: images/screenshot.png
