/**
 * Email Template Preview Component
 * Shows how the email will look with example data
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface Variable {
  key: string;
  label: string;
  example: string;
}

interface TemplatePreviewProps {
  subject: string;
  bodyHtml: string;
  variables: Variable[];
}

export default function TemplatePreview({ subject, bodyHtml, variables }: TemplatePreviewProps) {
  const [useExamples, setUseExamples] = useState(true);

  // Replace variables with example data
  const replaceVariables = (text: string): string => {
    if (!useExamples) return text;
    
    let result = text;
    variables.forEach((v) => {
      const regex = new RegExp(`\\{\\{\\s*${v.key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, `<span class="bg-yellow-100 text-yellow-900 px-1 rounded font-medium">${v.example}</span>`);
    });
    return result;
  };

  const previewSubject = replaceVariables(subject);
  const previewBody = replaceVariables(bodyHtml);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-700">Vorschau-Modus:</label>
        <button
          onClick={() => setUseExamples(!useExamples)}
          className={`px-3 py-1 rounded-md text-sm ${
            useExamples
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {useExamples ? 'Mit Beispieldaten' : 'Mit Variablen'}
        </button>
      </div>

      {/* Email Preview */}
      <Card className="border-2">
        <CardHeader className="bg-gray-50 border-b">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Von:</span>
              <span>Browo Koordinator &lt;no-reply@browo.de&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">An:</span>
              <span className="bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded">
                max.mustermann@example.com
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-sm text-gray-600">Betreff:</span>
              <div
                className="flex-1 text-gray-900"
                dangerouslySetInnerHTML={{ __html: previewSubject }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Email Body */}
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewBody }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      {useExamples && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-900 mb-2 font-medium">
              💡 Beispieldaten Legende:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {variables.map((v) => (
                <div key={v.key} className="flex items-center gap-2">
                  <code className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                    {`{{ ${v.key} }}`}
                  </code>
                  <span className="text-gray-600">→</span>
                  <span className="bg-yellow-100 text-yellow-900 px-1 rounded font-medium">
                    {v.example}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
