const fs = require('fs');
const path = 'src/components/ChartCanvas.tsx';
let code = fs.readFileSync(path, 'utf8');

// Ensure motion is imported
if (!code.includes("import { motion }")) {
  code = code.replace(
    "import React, { useState, useRef, useEffect } from 'react';",
    "import React, { useState, useRef, useEffect } from 'react';\nimport { motion } from 'motion/react';"
  );
}

// Add child count badge before closing the card
const childCountBadge = `
                  {/* Child count badge */}
                  {childCount > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-30 pointer-events-none">
                      {childCount}
                    </div>
                  )}
                </motion.div>
`;

code = code.replace(
  /<\/div>\s*\{\/\* Card End \*\/\}/m,
  childCountBadge + "\n              {/* Card End */}"
);

// We should also replace the closing </div> that matches the card. Let's find it.
// The easiest way is replacing `<div \n                id={\`card-${ln.id}\`}`
// with `<motion.div`. Let's see the exact code.
