import babel from "rollup-plugin-babel"; // Add the Babel plugin
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js", // The entry point for your project
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs",
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
    },
  ],
  plugins: [
    resolve(), // Resolves modules from node_modules
    commonjs(), // Converts commonjs to ES modules
    babel({
      exclude: "node_modules/**", // Exclude node_modules from being processed by Babel
      presets: ["@babel/preset-env", "@babel/preset-react"], // Add JSX and modern JavaScript support
    }),
  ],
};
