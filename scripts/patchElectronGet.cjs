const fs = require('fs');
const filePath = 'node_modules/app-builder-lib/out/util/electronGet.js';
let code = fs.readFileSync(filePath, 'utf8');

const target = 'throw new Error(`Extraction of ${path.basename(file)} produced no files`);';
const patch = `
        }
        try {
            await release();
        } catch (_) {}
        await fs.rm(dir, { recursive: true, force: true });
        try {
            await fs.rename(tmpDir, dir);
        } catch (renameErr) {
            const fsExtra = require("fs-extra");
            await fsExtra.copy(tmpDir, dir);
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
    }
    finally {
    }
}`;

if (code.includes(target)) {
  code = code.replace(target, target + patch);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully patched electronGet.js');
} else {
  console.error('Target not found in electronGet.js');
}
