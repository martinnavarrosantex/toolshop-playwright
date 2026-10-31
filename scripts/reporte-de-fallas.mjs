// Arma un reporte en el formato estándar de bugs de Santex por cada test que falló.
// Lo corre el pipeline después de la suite: lee el resultado JSON de Playwright y escribe
// reporte-de-fallas.md. Lo que el pipeline no puede saber (severidad, a quién afecta) queda
// marcado con [FALTA DATO] para que QA lo complete al revisar, igual que pide el estándar.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const entrada = process.argv[2] ?? 'resultados.json';
const salida = process.argv[3] ?? 'reporte-de-fallas.md';

if (!existsSync(entrada)) {
  console.log(`No hay ${entrada}: la suite no llegó a correr, no se genera reporte.`);
  process.exit(0);
}

const json = JSON.parse(readFileSync(entrada, 'utf8'));
const sinColores = (t = '') => t.replace(/\u001b\[[0-9;]*m/g, '').replace(/\/[^\s:]*?\/tests\//g, 'tests/');
const env = process.env;
const urlCorrida = env.GITHUB_RUN_ID
  ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : null;
const pr = env.GITHUB_REF?.match(/refs\/pull\/(\d+)\//)?.[1];
const baseURL = json.config?.projects?.[0]?.use?.baseURL ?? 'https://practicesoftwaretesting.com';

// Recorre los suites anidados y junta cada test con el nombre de su grupo (describe).
function* tests(suite, grupo = []) {
  const nombre = suite.title && !suite.title.endsWith('.ts') ? [...grupo, suite.title] : grupo;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) yield { spec, test: t, grupo: nombre };
  }
  for (const hijo of suite.suites ?? []) yield* tests(hijo, nombre);
}

const fallas = [];
for (const raiz of json.suites ?? []) {
  for (const item of tests(raiz)) {
    if (item.test.status === 'unexpected') fallas.push(item);
  }
}

function reporte({ spec, test, grupo }) {
  const ultimo = test.results[test.results.length - 1];
  const error = ultimo.errors?.[0] ?? ultimo.error ?? {};
  const mensaje = sinColores(error.message ?? 'Sin mensaje de error');
  const primeraLinea = (mensaje.split('\n').find((l) => l.trim()) ?? mensaje).replace(/^Error:\s*/, '');
  const donde = error.location
    ? `${error.location.file.replace(/^.*?\/tests\//, 'tests/')}:${error.location.line}`
    : `tests/${spec.file}:${spec.line}`;
  const datos = [...(test.annotations ?? []), ...(ultimo.annotations ?? [])]
    .filter((a) => a.type === 'dato')
    .map((a) => `- ${a.description}`)
    .filter((linea, i, todas) => todas.indexOf(linea) === i);
  const intentos = test.results.length;
  const evidencias = (ultimo.attachments ?? [])
    .filter((a) => a.path)
    .map((a) => `- ${a.name}: \`${a.path.replace(/^.*?test-results\//, 'test-results/')}\``);

  return `## [${grupo.join(' › ') || 'Suite'}] ${spec.title}

### Datos generales
- **Severidad**: [FALTA DATO: la define QA al revisar la falla]
- **Prioridad**: [FALTA DATO: la define el PO]
- **Ambiente**: ${baseURL}
- **Versión**: commit \`${env.GITHUB_SHA?.slice(0, 7) ?? '[FALTA DATO: corrida local]'}\`${env.GITHUB_HEAD_REF ? ` de la rama \`${env.GITHUB_HEAD_REF}\`` : ''}
- **Navegador / dispositivo**: ${test.projectName || 'navegador por defecto'} (Playwright), runner del pipeline
- **Ticket relacionado**: ${pr ? `pull request #${pr}` : '[FALTA DATO]'}
- **Reportado con**: Pipeline (reporte automático de la suite)

### Qué pasó
El test "${spec.title}" falló: ${primeraLinea.trim()}

### Pasos para reproducir
**Precondiciones**: dependencias instaladas (\`npm ci\` y \`npx playwright install chromium\`).
1. Correr \`npx playwright test tests/${spec.file}:${spec.line}\`.
2. Ver el paso que falla en \`${donde}\`.

**Resultado esperado**: el test pasa.
**Resultado obtenido**:
\`\`\`
${mensaje.trim().split('\n').slice(0, 15).join('\n')}
\`\`\`
**Frecuencia**: falló en ${intentos} de ${intentos} intentos de esta corrida

### Datos de prueba
${datos.length ? datos.join('\n') : '- [FALTA DATO: el test no registró los datos que usó]'}
- **De dónde salen los datos**: código del repositorio (\`tests/regresion/helpers.ts\`) y la demo compartida de Toolshop

### Origen
- **Cómo se encontró**: regresión automática en el pipeline
- **Capa**: [FALTA DATO: UI o API, según el paso que falla]
- **Dónde falla**: \`${donde}\`
- **Desde cuándo**: ${env.GITHUB_SHA ? `corrida del commit \`${env.GITHUB_SHA.slice(0, 7)}\`` : '[FALTA DATO]'}

### Impacto
- **Qué flujo afecta**: ${grupo.join(' › ') || spec.title} (caso de regresión "${spec.title}", ver \`docs/casos-regresion.md\`)
- **A quién afecta**: [FALTA DATO: lo completa QA al revisar]
- **Cuántos**: [FALTA DATO: lo completa QA al revisar]
- **¿Funcionaba antes?**: [FALTA DATO: comparar con la última corrida verde]

### Evidencia
${urlCorrida ? `- Corrida del pipeline: ${urlCorrida} (reporte HTML con traza en el artefacto \`playwright-report\`)\n` : ''}${evidencias.join('\n') || '- Ver el reporte HTML de Playwright'}
`;
}

const encabezado = `# Reporte de fallas de la regresión

Formato: Estándar de reporte de bugs de QA Santex (v1). Generado por el pipeline${urlCorrida ? ` en ${urlCorrida}` : ''}.
Antes de cargarlo como bug, QA confirma que es un defecto de la app y no del test, y completa los [FALTA DATO].
`;

const cuerpo = fallas.length
  ? fallas.map(reporte).join('\n---\n\n')
  : 'No falló ningún test en esta corrida.\n';

writeFileSync(salida, `${encabezado}\n${cuerpo}`);
console.log(`${fallas.length} falla(s) → ${salida}`);
