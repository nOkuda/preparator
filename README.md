## Preparator

Preparator is a browser-based tool that helps users convert Perseus Project XML files into .tess files, which are used by [Tesserae](https://github.com/tesserae/tesserae) to find intertexts.

### Using Preparator

Once Preparator has loaded in your web browser, you should see a few buttons, a few text fields, and a text area.  Clicking the topmost button allows you to load up a Perseus XML file into Preparator.  Once the XML file is chosen, the text fields should be automatically populated.  If you would like to make any changes to the text fields, you can do so.

When you are happy with the text fields, you can push the "Convert" button to make Preparator generate the lines of a .tess file from your chosen Perseus XML file.  Note that every line contains the abbreviations you chose earlier.  If you are unsatisfied with the abbreviations, you can change them up in the text fields and push the "Convert" button again to update the lines of the .tess file.

When you are happy with how the lines look, you can push the "Save" button to save the .tess file to your computer.  Note that the default name of the .tess file is based off of the author abbreviation followed by the text abbreviation.

### Obtaining the Correct XML files

Use the latest versions of the Perseus XML files.  They are found at the following respositories:

  * https://github.com/PerseusDL/canonical-latinLit
  * https://github.com/PerseusDL/canonical-greekLit

If Preparator does not return nice results, you might want to fix the Perseus XML files and contribute your fixes to the appropriate repository.  See their repository wikis for details on how to contribute to their repositories.

### Development Notes

This tool is written as a React component with the help of [neutrinojs/react-components](https://neutrinojs.org/packages/react-components/).  According to neutrinojs project layout standards, the React component can be found at `src/components/Preparator.jsx`.  The heavy lifting is done by code in `src/parsing.js`.

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

#### Hosting

For now, use neutrino's create-project script to build a react website with [neutrinojs/react](https://neutrinojs.org/packages/react/).  To integrate Preparator into the react website, copy the files from this repository's `src` directory into the react website's `src` directory, and make the appropriate imports in the react website (the main file is `src/index.js`).  After successfully building the react website with `npm run build`, copy the files located in the `build` directory to a location where you can serve the files.
