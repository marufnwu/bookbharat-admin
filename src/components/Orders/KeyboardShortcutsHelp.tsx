import React from 'react';
import { Modal } from '../../components';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['j'], description: 'Next row' },
  { keys: ['k'], description: 'Previous row' },
  { keys: ['Enter'], description: 'Open quick view' },
  { keys: ['p'], description: 'Process order' },
  { keys: ['s'], description: 'Ship order' },
  { keys: ['d'], description: 'Mark delivered' },
  { keys: ['x'], description: 'Cancel order' },
  { keys: ['1-8'], description: 'Switch status tabs' },
  { keys: ['e'], description: 'Export orders' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['Esc'], description: 'Close drawer / modal' },
];

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal open={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="sm">
      <div className="space-y-1">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.keys.join('')} className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50">
            <span className="text-sm text-gray-700">{shortcut.description}</span>
            <div className="flex gap-1">
              {shortcut.keys.map((key) => (
                <kbd
                  key={key}
                  className="px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-600"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400 text-center">
        Shortcuts are disabled while typing in search or input fields.
      </p>
    </Modal>
  );
};
