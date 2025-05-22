import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

packageJson.scripts.deploy = "node scripts/deploy.mjs --all";
packageJson.scripts["deploy:rules"] = "node scripts/deploy.mjs --rules";
packageJson.scripts["deploy:indexes"] = "node scripts/deploy.mjs --indexes";
packageJson.scripts["deploy:functions"] = "node scripts/deploy.mjs --functions";

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
console.log('Updated package.json with new deploy.mjs paths');
