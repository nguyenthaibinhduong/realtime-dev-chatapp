import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
  SandpackFileExplorer,
  SandpackCodeViewer,
  SandpackPreview,
  Sandpack,
} from "@codesandbox/sandpack-react";
import { autocompletion } from "@codemirror/autocomplete";

const extendedTest = `import * as matchers from 'jest-extended';
import { add } from './add';

expect.extend(matchers);

describe('jest-extended matchers are supported', () => {
test('adding two positive integers yields a positive integer', () => {
expect(add(1, 2)).toBePositive();
});
});
`;

export const TestLayout = () => (
  <SandpackProvider
    customSetup={{ dependencies: { "jest-extended": "^3.0.2" } }}
    files={{ "/extended.test.ts": extendedTest }}
    template="test-ts"
  >
    <SandpackLayout>
      <SandpackFileExplorer />
      <SandpackCodeEditor />
      <SandpackTests />
    </SandpackLayout>
  </SandpackProvider>
);

export const EditorLayout = () => (
  <SandpackProvider template="react">
    <SandpackLayout>
      <SandpackFileExplorer />
      <SandpackCodeEditor
        showTabs
        showLineNumbers
        showInlineErrors
        wrapContent
        closableTabs
        extensions={[autocompletion()]}
      />
      <SandpackPreview />
    </SandpackLayout>
  </SandpackProvider>
);
