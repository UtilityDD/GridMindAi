// Test the table repair logic
const raw = `The current carrying capacities for AAC conductors are provided in a table within the document: | CODE NAME | AREA (mm2) | SIZE Al/St/Dia. (mm.) | WEIGHT (Kg/Km) | Current Carrying Capacity at 45oC* (Amp) | | --- | --- | --- | --- | --- | | Gnat | 25 | 7/2.21 | 74 | 120 | | Ant | 50 | 7/3.10 | 145 | 189 | | Grasshopper | 80 | 7/3.91 | 230 | 255 | | ... | ... | ... | ... | ... |`;

function repairSquashedTables(input) {
  const lines = input.split('\n');
  const result = [];

  for (const line of lines) {
    const hasSep = /\|\s*---\s*\|/.test(line);
    const pipeCount = (line.match(/\|/g) || []).length;

    if (hasSep && pipeCount > 6) {
      console.log('DETECTED! Pipes:', pipeCount);
      const firstPipeIdx = line.indexOf('|');
      const beforeTable = firstPipeIdx > 0 ? line.substring(0, firstPipeIdx).trimEnd() : '';
      const tableStr = line.substring(firstPipeIdx);

      const lastPipeIdx = tableStr.lastIndexOf('|');
      const afterTable = tableStr.substring(lastPipeIdx + 1).trim();
      const pureTable = tableStr.substring(0, lastPipeIdx + 1);

      const sepMatch = pureTable.match(/((?:\|\s*-{3,}\s*)+\|)/);
      if (!sepMatch) { result.push(line); continue; }
      const colCount = (sepMatch[0].match(/-{3,}/g) || []).length;
      console.log('Columns:', colCount);

      const parts = pureTable.split('|');
      const cells = parts.slice(1, -1);
      console.log('Total cells:', cells.length);
      console.log('Cells:', cells.map(c => c.trim()));

      const rowSize = colCount + 1;
      const rows = [];
      for (let i = 0; i < cells.length; i += rowSize) {
        const rowCells = cells.slice(i, i + colCount);
        if (rowCells.length > 0) {
          rows.push('| ' + rowCells.map(c => c.trim()).join(' | ') + ' |');
        }
      }

      if (beforeTable) {
        result.push(beforeTable);
        result.push('');
      }
      result.push(...rows);
      if (afterTable) {
        result.push('');
        result.push(afterTable);
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

const repaired = repairSquashedTables(raw);
console.log('\n=== REPAIRED OUTPUT ===');
console.log(repaired);
console.log('\n=== END ===');
