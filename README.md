## Tesserae File Preparation Utility

Tesserae works with .tess files to find intertexts.  Texts not already in this format must be converted before being added to Tesserae.  This browser-based tool helps users convert texts into a .tess file.

### Development Notes

This tool is written as a React component with the help of [neutrinojs/react-components](https://neutrinojs.org/packages/react-components/).  According to neutrinojs project layout standards, the React component can be found at `src/components/Preparator.js`.

#### Prerequisites

  * [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  * [Node.js](https://nodejs.org/en/)

#### Quickstart
```
git clone git@github.com:tesserae/preparator.git
cd preparator
npm install
npm start
```
