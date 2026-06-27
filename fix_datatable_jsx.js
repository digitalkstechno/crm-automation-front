const fs = require('fs');
const path = require('path');

const filePath = path.join('e:/manav/project/automation-crm/crm-automation-front/src/components/DataTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic block
const badBlockStart = content.indexOf('{sortableRows ? (');
const badBlockEnd = content.indexOf('</table>', badBlockStart);

const badBlockStr = content.substring(badBlockStart, badBlockEnd);

// I will just replace the exact tags
let newBlock = badBlockStr;
newBlock = newBlock.replace('{sortableRows ? (\n              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>\n                <SortableContext items={data.map(d => d.id || d._id)} strategy={verticalListSortingStrategy}>\n                  <tbody className="divide-y divide-gray-50 bg-white">', 
`
            {sortableRows ? (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={data.map((d: any) => d.id || d._id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-50 bg-white">
`);
newBlock = newBlock.replace('            {sortableRows && (\n                </SortableContext>\n              </DndContext>\n            )}', 
`                  </tbody>
                </SortableContext>
              </DndContext>
            ) : (
              <tbody className="divide-y divide-gray-50 bg-white">
                {/* fallback tbody */}
                {data.map((row: any, index: number) => {
                  return (
                    <tr key={index} className="border-b">
                       {/* This won't work well if we copy paste the whole body again. */}
                    </tr>
                  )
                })}
              </tbody>
            )}
`);

// The better way is to define a helper function inside the component to render rows, or just use a wrapper component.

// Actually, I can just build a custom SortableTableBody wrapper inside DataTable.tsx!
