const { homedir } = require('node:os')
const { join } = require('node:path')
const { readFile, writeFile } = require('node:fs/promises')

const fallbackConfig = {
  zones: [
    { id: 'zone-01', name: 'Zone 01' },
    { id: 'zone-02', name: 'Zone 02' },
    { id: 'zone-03', name: 'Zone 03' },
    { id: 'zone-04', name: 'Zone 04' },
    { id: 'finish-line', name: 'Finish Line' },
    { id: 'starting-line', name: 'Starting Line' },
  ],
  photographers: [
    { id: 'john-doe', initials: 'JD', name: 'John Doe' },
    { id: 'jane-smith', initials: 'JS', name: 'Jane Smith' },
    { id: 'michael-cruz', initials: 'MC', name: 'Michael Cruz' },
    { id: 'alex-santos', initials: 'AS', name: 'Alex Santos' },
  ],
}

async function copyCrewConfig(outputPaths) {
  const appDataPath = process.env.APPDATA
    ?? process.env.XDG_CONFIG_HOME
    ?? join(homedir(), process.platform === 'darwin' ? 'Library/Application Support' : '.config')
  const savedConfigPath = join(appDataPath, 'photo-extractor', 'photo-extractor', 'config.json')
  let config = fallbackConfig

  try {
    const savedConfig = JSON.parse(await readFile(savedConfigPath, 'utf8'))
    if (Array.isArray(savedConfig.zones) && Array.isArray(savedConfig.photographers)) config = savedConfig
  } catch {
    // Use the starter crew if no saved configuration exists on the build machine.
  }

  await Promise.all(outputPaths.map((outputPath) =>
    writeFile(join(outputPath, 'config.json'), JSON.stringify(config, null, 2), 'utf8'),
  ))
}

module.exports = {
  outDir: 'release',
  packagerConfig: {
    asar: true,
    executableName: 'photo-extractor',
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: { name: 'photo_extractor' },
    },
    { name: '@electron-forge/maker-deb', platforms: ['linux'] },
    { name: '@electron-forge/maker-zip' },
  ],
  hooks: {
    postPackage: async (_forgeConfig, { outputPaths }) => copyCrewConfig(outputPaths),
  },
}