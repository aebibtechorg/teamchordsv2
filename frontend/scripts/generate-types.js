const fs = require('fs');
const path = require('path');

const dtoDir = path.resolve(__dirname, '../../tcv2.Api/Data/Dto');
const entityDir = path.resolve(__dirname, '../../tcv2.Api/Data/Entities');
const outputDir = path.resolve(__dirname, '../src/types');
const outputFile = path.join(outputDir, 'api.ts');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function mapType(csType) {
  const isArray = csType.endsWith('[]') || csType.startsWith('List<') || csType.startsWith('ICollection<') || csType.startsWith('IEnumerable<');
  let cleanType = csType
    .replace('?', '')
    .replace('[]', '')
    .replace(/^List<(.+)>$/, '$1')
    .replace(/^ICollection<(.+)>$/, '$1')
    .replace(/^IEnumerable<(.+)>$/, '$1')
    .trim();

  let tsType = 'any';
  switch (cleanType) {
    case 'string':
      tsType = 'string';
      break;
    case 'int':
    case 'short':
    case 'long':
    case 'float':
    case 'double':
    case 'decimal':
      tsType = 'number';
      break;
    case 'bool':
    case 'Boolean':
      tsType = 'boolean';
      break;
    case 'Guid':
      tsType = 'string';
      break;
    case 'DateTime':
    case 'DateTimeOffset':
      tsType = 'string'; // ISO string
      break;
    case 'Plan':
      tsType = 'Plan';
      break;
    case 'SubscriptionStatus':
      tsType = 'SubscriptionStatus';
      break;
    default:
      tsType = cleanType;
      break;
  }

  return isArray ? `${tsType}[]` : tsType;
}

function parseDtoFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const classes = [];
  let currentClass = null;

  for (let line of lines) {
    line = line.trim();

    // Check for class declaration
    const classMatch = line.match(/public\s+(?:class|record)\s+(\w+)(?:\s*:\s*(\w+))?/);
    if (classMatch) {
      if (currentClass) classes.push(currentClass);
      currentClass = {
        name: classMatch[1],
        inherits: classMatch[2] || null,
        properties: []
      };
      continue;
    }

    // Check for properties: public <Type> <Name> { get; set; }
    const propMatch = line.match(/public\s+(?:required\s+)?([\w<>\[\]\?]+)\s+(\w+)\s*\{/);
    if (propMatch && currentClass) {
      const type = propMatch[1];
      const name = propMatch[2];
      const optional = type.includes('?') || line.includes('null') || !line.includes('required');
      // camelCase property name
      const camelName = name.charAt(0).toLowerCase() + name.slice(1);
      currentClass.properties.push({
        name: camelName,
        type: mapType(type),
        optional: optional || type.includes('?')
      });
    }

    // Check for record constructor parameters (e.g. string EventType,)
    const recordParamMatch = line.match(/^\s*([A-Za-z0-9_<>\[\]\?]+)\s+([A-Za-z0-9_]+)\s*,?\s*$/);
    if (recordParamMatch && currentClass && !line.includes('public') && !line.includes('class') && !line.includes('{') && !line.includes('}')) {
      const type = recordParamMatch[1];
      const name = recordParamMatch[2];
      const camelName = name.charAt(0).toLowerCase() + name.slice(1);
      currentClass.properties.push({
        name: camelName,
        type: mapType(type),
        optional: type.includes('?')
      });
    }
  }

  if (currentClass) {
    classes.push(currentClass);
  }

  return classes;
}

const dtoFiles = fs.readdirSync(dtoDir).filter(f => f.endsWith('.cs'));
let allTsCode = `// Auto-generated types from tcv2.Api DTOs\n\n`;

allTsCode += `export enum Plan {\n  Free = 0,\n  GiggingBand = 1,\n  Organization = 2\n}\n\n`;
allTsCode += `export enum SubscriptionStatus {\n  None = 0,\n  Active = 1,\n  ScheduledToEnd = 2,\n  Canceled = 3,\n  PastDue = 4,\n  Incomplete = 5\n}\n\n`;

for (const file of dtoFiles) {
  const parsed = parseDtoFile(path.join(dtoDir, file));
  for (const item of parsed) {
    const extendsClause = item.inherits ? ` extends ${item.inherits}` : '';
    allTsCode += `export interface ${item.name}${extendsClause} {\n`;
    for (const prop of item.properties) {
      allTsCode += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};\n`;
    }
    allTsCode += `}\n\n`;
  }
}

fs.writeFileSync(outputFile, allTsCode, 'utf-8');
console.log(`Generated types successfully at: ${outputFile}`);
