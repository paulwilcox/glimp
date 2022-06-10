import license from 'rollup-plugin-license';
import fs from 'fs';

// Run license() here, not in the objects of the exported 
// array.  Otherwise, the third party licence file gets 
// overwritten, not appended to.
let licensePlugin = license({
    banner: { content: { file: 'license.md' } }/*,
    thirdParty: {
        output: 'license-3rd-party',
        includePrivate: true
    }*/
});

let printCss = fs.readFileSync('./src/print.css');
fs.writeFileSync(
    './src/print.css.js', 
    `export default \`\n\n${printCss}\n\n\``
)

export default [
    {
        input: 'src/glimp.client.js',
        output: {
            file: 'dist/glimp.client.js',
            format: 'esm'
        },
        plugins: licensePlugin
    },
    {
        input: 'src/glimp.server.js',
        output: {
            file: 'dist/glimp.server.js',
            format: 'cjs'
        },
        plugins: licensePlugin
    }    
];

