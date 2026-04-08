import React, { useMemo, useRef } from 'react';
import JoditEditor from 'jodit-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  className = '',
  disabled = false,
}) => {
  const editor = useRef<any>(null);

  const config = useMemo<any>(
    () => ({
      readonly: disabled,
      placeholder: placeholder,
      theme: 'default',
      toolbar: true,
      toolbarAdaptive: true,
      buttons: [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'eraser', 'superscript', 'subscript', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'image', 'video', 'table', 'link', '|',
        'ul', 'ol', 'outdent', 'indent', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'copyformat', 'fullsize',
      ],
      buttonsMD: [
        'bold', 'italic', 'underline', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'image', 'video', 'table', 'link', '|',
        'ul', 'ol', '|',
        'align', 'undo', 'redo', '|',
        'fullsize',
      ],
      buttonsSM: [
        'bold', 'italic', 'underline', '|',
        'brush', 'paragraph', '|',
        'image', 'video', 'link', '|',
        'ul', 'ol', '|',
        'align', 'undo', 'redo',
      ],
      style: {
        fontfamily:
          'Arial, Helvetica, sans-serif, serif, monospace, cursive, fantasy',
      },
      allowResizeX: false,
      allowResizeY: true,
      height: 350,
      defaultActionOnPasteFromWord: 'insert_clear_html',
      askBeforePasteFromWord: false,
      askBeforePasteHTML: false,
      disablePlugins: ['stat'],
      cleanHTML: {
        fillEmptyParagraph: false,
      },
      uploader: {
        insertImageAsBase64URI: true,
      },
      video: {
        defaultWidth: '100%',
        defaultHeight: 400,
      },
    }),
    [disabled, placeholder]
  );

  return (
    <div className={`rich-text-editor ${className}`}>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)}
      />
    </div>
  );
};

export default RichTextEditor;
