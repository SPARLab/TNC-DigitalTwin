// Builds each standalone Experience (a separate app kept as a git submodule
// under standalone-experiences/) into public/standalone-experiences/<id>/, so
// `vite dev` serves it and `vite build` copies it into dist/. The Experiences
// page embeds the built app in an iframe at the same path.
//
// To preview unpushed work, point an Experience at a local checkout instead of
// the submodule, e.g.
//   CREEK_WATER_VISUALIZATION_SOURCE_DIR=../creek-water-visualization/worktree-2 npm run build:standalone-experiences
//
// `--if-missing` skips an Experience whose build output already exists, so
// `npm run dev` only pays the ~20 s build once. `--warn-on-failure` reports a
// failed build without failing the command, so a broken standalone Experience
// never blocks Digital Twin development; production builds leave it off.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STANDALONE_EXPERIENCES = [
  {
    id: 'creek-water-visualization',
    submodulePath: 'standalone-experiences/creek-water-visualization',
    sourceDirEnvVar: 'CREEK_WATER_VISUALIZATION_SOURCE_DIR',
    workspace: 'creek-visualization-browser',
  },
];

function run(command, args, cwd) {
  console.log(`  $ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function resolveSourceDir(experience) {
  const override = process.env[experience.sourceDirEnvVar]?.trim();
  if (override) return path.resolve(repoRoot, override);

  const submoduleDir = path.join(repoRoot, experience.submodulePath);
  if (!existsSync(path.join(submoduleDir, 'package.json'))) {
    // Fresh clones without --recurse-submodules land here.
    run('git', ['submodule', 'update', '--init', experience.submodulePath], repoRoot);
  }
  return submoduleDir;
}

const skipExistingBuilds = process.argv.includes('--if-missing');
const warnOnFailure = process.argv.includes('--warn-on-failure');

function buildStandaloneExperience(experience, outDir) {
  const basePath = `/standalone-experiences/${experience.id}/`;
  const sourceDir = resolveSourceDir(experience);
  if (!existsSync(path.join(sourceDir, 'package.json'))) {
    throw new Error(`${experience.id}: no package.json in ${sourceDir}.`);
  }

  console.log(`\nBuilding standalone Experience "${experience.id}" from ${sourceDir}`);
  if (!existsSync(path.join(sourceDir, 'node_modules'))) {
    run('npm', ['ci', '--no-audit', '--no-fund'], sourceDir);
  }
  run(
    'npm',
    ['run', 'build', '--workspace', experience.workspace, '--', `--base=${basePath}`, `--outDir=${outDir}`, '--emptyOutDir'],
    sourceDir,
  );
}

for (const experience of STANDALONE_EXPERIENCES) {
  const outDir = path.join(repoRoot, 'public', 'standalone-experiences', experience.id);

  if (skipExistingBuilds && existsSync(path.join(outDir, 'index.html'))) {
    console.log(`Standalone Experience "${experience.id}" is already built; skipping (npm run build:standalone-experiences rebuilds it).`);
    continue;
  }

  try {
    buildStandaloneExperience(experience, outDir);
  } catch (error) {
    if (!warnOnFailure) throw error;
    console.warn(`\nWarning: standalone Experience "${experience.id}" did not build; its card will show a missing page.`);
    console.warn(error instanceof Error ? error.message : error);
  }
}
