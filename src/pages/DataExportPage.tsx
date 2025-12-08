import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportResult {
  collection: string;
  count: number;
  data: unknown[];
}

const COLLECTIONS = [
  { id: 'stalls', label: 'Stalls', description: 'Property stall units' },
  { id: 'tenants', label: 'Tenants', description: 'Tenant business records' },
  { id: 'payments', label: 'Payments', description: 'Payment transactions' },
  { id: 'inquiries', label: 'Inquiries', description: 'Guest stall inquiries' },
  { id: 'notifications', label: 'Notifications', description: 'System notifications' },
  { id: 'app_settings', label: 'App Settings', description: 'Application configuration' },
];

export default function DataExportPage() {
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    COLLECTIONS.map(c => c.id)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);

  const toggleCollection = (id: string) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedCollections(COLLECTIONS.map(c => c.id));
  const deselectAll = () => setSelectedCollections([]);

  const fetchCollectionData = async (collection: string): Promise<ExportResult> => {
    const { data, error } = await supabase
      .from(collection as 'stalls' | 'tenants' | 'payments' | 'inquiries' | 'notifications' | 'app_settings')
      .select('*');

    if (error) {
      console.error(`Error fetching ${collection}:`, error);
      return { collection, count: 0, data: [] };
    }

    return { collection, count: data?.length || 0, data: data || [] };
  };

  const handleExport = async () => {
    if (selectedCollections.length === 0) {
      toast.error('Please select at least one collection to export');
      return;
    }

    setIsExporting(true);
    setExportResults([]);

    try {
      const results: ExportResult[] = [];

      for (const collection of selectedCollections) {
        const result = await fetchCollectionData(collection);
        results.push(result);
      }

      setExportResults(results);

      // Create combined export object
      const exportData: Record<string, unknown[]> = {};
      results.forEach(result => {
        exportData[result.collection] = result.data;
      });

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `directus-import-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportIndividual = async (collection: string) => {
    setIsExporting(true);

    try {
      const result = await fetchCollectionData(collection);

      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${collection} exported (${result.count} records)`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${collection}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Data Export for Directus</h1>
          <p className="text-muted-foreground">
            Export your Supabase data as JSON for importing into Directus
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select Collections to Export
            </CardTitle>
            <CardDescription>
              Choose which collections to include in the export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COLLECTIONS.map(collection => (
                <div
                  key={collection.id}
                  className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={collection.id}
                    checked={selectedCollections.includes(collection.id)}
                    onCheckedChange={() => toggleCollection(collection.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={collection.id}
                      className="font-medium cursor-pointer"
                    >
                      {collection.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExportIndividual(collection.id)}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting || selectedCollections.length === 0}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected Collections ({selectedCollections.length})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {exportResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Export Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {exportResults.map(result => (
                  <div
                    key={result.collection}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {result.count > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium">{result.collection}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {result.count} records
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Directus Import Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Create matching collections in Directus (see DIRECTUS_DATA_MODEL.md)</li>
              <li>Download the exported JSON file</li>
              <li>In Directus, go to each collection's Content page</li>
              <li>Use the import feature or Directus API to import the data</li>
              <li>Verify relationships are correctly mapped</li>
            </ol>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium text-foreground mb-2">API Import Example:</p>
              <code className="text-xs">
                POST /items/stalls
                <br />
                Content-Type: application/json
                <br />
                Authorization: Bearer YOUR_TOKEN
                <br />
                Body: [array of stall objects]
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
