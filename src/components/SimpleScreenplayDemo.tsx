import React, { useState, useRef, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface Block {
  id: string;
  type: 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';
  content: string;
}

const SimpleScreenplayDemo: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: '1',
      type: 'scene-heading',
      content: 'INT. COFFEE SHOP - DAY'
    },
    {
      id: '2',
      type: 'action',
      content: 'A bustling coffee shop filled with the aroma of freshly brewed coffee. SARAH, 25, sits at a corner table, typing furiously on her laptop.'
    },
    {
      id: '3',
      type: 'character',
      content: 'SARAH'
    },
    {
      id: '4',
      type: 'dialogue',
      content: 'This screenplay editor is amazing! I can finally write my story the way I envision it.'
    },
    {
      id: '5',
      type: 'action',
      content: 'She takes a sip of her coffee and continues writing, a smile spreading across her face.'
    }
  ]);

  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const addNewBlock = (afterId: string, type: Block['type'] = 'action') => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: ''
    };

    const index = blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setActiveBlock(newBlock.id);

    // Focus the new block after a short delay
    setTimeout(() => {
      const element = blockRefs.current[newBlock.id];
      if (element) {
        element.focus();
      }
    }, 100);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentBlock = blocks.find(b => b.id === blockId);
      if (currentBlock) {
        // Determine next block type based on current type
        let nextType: Block['type'] = 'action';
        if (currentBlock.type === 'character') {
          nextType = 'dialogue';
        } else if (currentBlock.type === 'dialogue') {
          nextType = 'action';
        }
        addNewBlock(blockId, nextType);
      }
    }
  };

  const getBlockStyle = (type: Block['type']) => {
    const baseStyle = `w-full p-2 border-none outline-none resize-none min-h-[2rem] ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
    }`;

    switch (type) {
      case 'scene-heading':
        return `${baseStyle} font-bold uppercase text-center`;
      case 'action':
        return `${baseStyle} leading-relaxed`;
      case 'character':
        return `${baseStyle} font-semibold uppercase text-center max-w-md mx-auto`;
      case 'dialogue':
        return `${baseStyle} max-w-lg mx-auto leading-relaxed`;
      case 'parenthetical':
        return `${baseStyle} max-w-sm mx-auto italic`;
      case 'transition':
        return `${baseStyle} font-semibold uppercase text-right`;
      default:
        return baseStyle;
    }
  };

  const getBlockLabel = (type: Block['type']) => {
    switch (type) {
      case 'scene-heading': return 'Scene Heading';
      case 'action': return 'Action';
      case 'character': return 'Character';
      case 'dialogue': return 'Dialogue';
      case 'parenthetical': return 'Parenthetical';
      case 'transition': return 'Transition';
      default: return type;
    }
  };

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Simple Screenplay Editor Demo
          </h1>
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            A working screenplay editor with proper formatting. Try editing the content below!
          </p>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              How to Use:
            </h3>
            <ul className={`space-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Click on any block to edit it</li>
              <li>• Press Enter to create a new block</li>
              <li>• Character blocks automatically create dialogue blocks</li>
              <li>• Dialogue blocks automatically create action blocks</li>
              <li>• Each block type has its own formatting style</li>
            </ul>
          </div>
        </div>

        <div className={`rounded-lg shadow-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="space-y-4">
            {blocks.map((block) => (
              <div key={block.id} className="relative group">
                {/* Block type indicator */}
                <div className={`absolute -left-20 top-2 text-xs font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                } opacity-0 group-hover:opacity-100 transition-opacity`}>
                  {getBlockLabel(block.type)}
                </div>
                
                <textarea
                  ref={(el) => blockRefs.current[block.id] = el}
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  onFocus={() => setActiveBlock(block.id)}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  className={`${getBlockStyle(block.type)} ${
                    activeBlock === block.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  placeholder={`Enter ${getBlockLabel(block.type).toLowerCase()}...`}
                  rows={Math.max(1, Math.ceil(block.content.length / 80))}
                />
              </div>
            ))}
          </div>

          {/* Add block buttons */}
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => addNewBlock(blocks[blocks.length - 1]?.id || '1', 'scene-heading')}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              + Scene Heading
            </button>
            <button
              onClick={() => addNewBlock(blocks[blocks.length - 1]?.id || '1', 'action')}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              + Action
            </button>
            <button
              onClick={() => addNewBlock(blocks[blocks.length - 1]?.id || '1', 'character')}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              + Character
            </button>
            <button
              onClick={() => addNewBlock(blocks[blocks.length - 1]?.id || '1', 'dialogue')}
              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              + Dialogue
            </button>
          </div>
        </div>

        <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDarkMode ? 'border-yellow-700' : 'border-yellow-200'}`}>
          <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            Screenplay Formatting Guide
          </h4>
          <div className={`text-sm space-y-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
            <p><strong>Scene Heading:</strong> Describes location and time (e.g., "INT. COFFEE SHOP - DAY")</p>
            <p><strong>Action:</strong> Describes what happens in the scene</p>
            <p><strong>Character:</strong> Name of the person speaking (in CAPS)</p>
            <p><strong>Dialogue:</strong> What the character says</p>
            <p><strong>Parenthetical:</strong> Direction for how dialogue is delivered</p>
            <p><strong>Transition:</strong> How we move between scenes (e.g., "FADE OUT")</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleScreenplayDemo;
