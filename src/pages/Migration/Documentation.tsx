import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ServerIcon,
  CogIcon,
  PlayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  KeyIcon,
  PhotoIcon,
  FunnelIcon,
  EyeIcon,
  BookmarkIcon,
  QuestionMarkCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

const MigrationDocumentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
    { id: 'setup', label: 'Setup Guide', icon: CogIcon },
    { id: 'usage', label: 'Usage Guide', icon: PlayIcon },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: ExclamationTriangleIcon },
    { id: 'api', label: 'API Reference', icon: CodeBracketIcon },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Migration System Overview</h2>
              <p className="text-gray-600 mb-6">
                The BookBharat Migration System provides a comprehensive solution for transferring product-related
                data from the legacy system to the new v2 platform with automated synchronization and conflict resolution.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Key Features
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <ArrowRightIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Automated one-way synchronization from legacy to v2 system</span>
                </li>
                <li className="flex items-start">
                  <ArrowRightIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Old system priority conflict resolution with manual override options</span>
                </li>
                <li className="flex items-start">
                  <ArrowRightIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Image migration with optimization and storage management</span>
                </li>
                <li className="flex items-start">
                  <ArrowRightIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Real-time monitoring with detailed logs and statistics</span>
                </li>
                <li className="flex items-start">
                  <ArrowRightIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Scheduled automatic sync with configurable intervals</span>
                </li>
                <li className="flex items-start">
                  <ArrowRightIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Preview mode for safe migration planning</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Migration Flow</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Connect to Legacy System</h4>
                      <p className="text-sm text-gray-600">Configure secure API connection to your legacy BookBharat system</p>
                    </div>
                  </div>
                  <ArrowDownIcon className="h-5 w-5 text-gray-400 mx-auto" />
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Preview Migration</h4>
                      <p className="text-sm text-gray-600">See what data will be migrated before executing</p>
                    </div>
                  </div>
                  <ArrowDownIcon className="h-5 w-5 text-gray-400 mx-auto" />
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Execute Migration</h4>
                      <p className="text-sm text-gray-600">Run full migration or incremental sync with conflict resolution</p>
                    </div>
                  </div>
                  <ArrowDownIcon className="h-5 w-5 text-gray-400 mx-auto" />
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Monitor & Maintain</h4>
                      <p className="text-sm text-gray-600">Track progress, resolve conflicts, and schedule automatic sync</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Setup Guide</h2>
              <p className="text-gray-600 mb-6">
                Follow these steps to configure and set up the migration system for your environment.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
                  Legacy System Configuration
                </h3>
                <div className="ml-11 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <ServerIcon className="h-4 w-4 mr-2" />
                      Enable Migration API
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      In your legacy system (located at <code className="bg-gray-100 px-1 py-0.5 rounded">d:/Laravel/bookbharat</code>), ensure the migration API is enabled:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
{`// In legacy system's .env file
MIGRATION_API_TOKEN=your-secure-64-character-token-here
MIGRATION_RATE_LIMIT_ENABLED=true`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Generate Secure Token
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Generate a secure API token using Laravel's tinker:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">php artisan tinker
echo Str::random(64)</pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</span>
                  V2 System Configuration
                </h3>
                <div className="ml-11 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <CogIcon className="h-4 w-4 mr-2" />
                      Access Migration Settings
                    </h4>
                    <p className="text-sm text-gray-600">
                      Navigate to <strong>Migration → Settings</strong> in the admin panel to configure connection parameters.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      Configure Connection Details
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• <strong>Legacy System URL:</strong> Full URL to your legacy system (e.g., https://legacy.bookbharat.com)</li>
                      <li>• <strong>API Token:</strong> The secure token generated in step 1</li>
                      <li>• <strong>Auto Sync:</strong> Enable automatic synchronization</li>
                      <li>• <strong>Sync Interval:</strong> Set frequency (recommended: 15-60 minutes)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</span>
                  Test Connection
                </h3>
                <div className="ml-11">
                  <p className="text-sm text-gray-600 mb-3">
                    Use the "Test Connection" button in the settings or dashboard to verify the connection:
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-800 font-medium">Success:</span>
                      <span className="text-green-700 ml-2">Connection established and legacy system is accessible</span>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-800 font-medium">Error:</span>
                      <span className="text-red-700 ml-2">Check URL, token, and legacy system availability</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">4</span>
                  Schedule Automated Sync
                </h3>
                <div className="ml-11 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Enable Laravel Scheduler
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Add the following cron job to your server for automated sync:
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">* * * * * cd /path/to/bookbharat-backend &amp;&amp; php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Configure Sync Settings</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Enable auto-sync in Migration Settings</li>
                      <li>• Set appropriate sync interval (start with 30 minutes)</li>
                      <li>• Choose which entity types to sync</li>
                      <li>• Configure conflict resolution strategy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage Guide</h2>
              <p className="text-gray-600 mb-6">
                Learn how to effectively use the migration system for data synchronization.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Preview Before Migration
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Always preview migrations before execution to understand what will be transferred:
                  </p>
                  <ol className="text-sm text-gray-600 space-y-2 ml-6 list-decimal">
                    <li>Navigate to <strong>Migration Dashboard</strong></li>
                    <li>Click <strong>"Preview Migration"</strong> button</li>
                    <li>Review the data counts and entities that will be migrated</li>
                    <li>Proceed with migration or adjust settings as needed</li>
                  </ol>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Preview mode is safe and doesn't make any changes to your data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Running Migrations
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Full Migration</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Use for initial migration or when you need to transfer all data:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Migrates all categories, products, and images</li>
                      <li>• Creates new records and updates existing ones</li>
                      <li>• Handles conflicts based on your resolution strategy</li>
                      <li>• Can take significant time for large datasets</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Incremental Sync</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Use for ongoing synchronization of new or updated data:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Only processes changes since last sync</li>
                      <li>• Faster and more efficient for regular updates</li>
                      <li>• Recommended for scheduled automation</li>
                      <li>• Preserves existing data in v2 system</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Managing Conflicts
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    When data exists in both systems, conflicts are automatically created for resolution:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h5 className="font-medium text-yellow-800 mb-1">Conflict Types:</h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• <strong>Data Mismatch:</strong> Same record has different values</li>
                        <li>• <strong>Missing References:</strong> Related records don't exist</li>
                        <li>• <strong>Validation Errors:</strong> Data doesn't meet v2 requirements</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-1">Resolution Strategies:</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Old System Priority:</strong> Legacy data overwrites v2 data (default)</li>
                        <li>• <strong>New System Priority:</strong> V2 data is preserved</li>
                        <li>• <strong>Manual Review:</strong> Requires admin decision</li>
                        <li>• <strong>Skip:</strong> Ignore conflicting records</li>
                        <li>• <strong>Merge:</strong> Combine data from both systems</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Image Migration
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Images are automatically processed during migration:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• Images are downloaded from legacy system URLs</li>
                    <li>• Optional optimization can reduce file sizes</li>
                    <li>• Images are stored in v2 system's storage</li>
                    <li>• Multiple sizes (thumbnail, medium, large) are generated</li>
                    <li>• Failed images are logged but don't stop migration</li>
                  </ul>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> Enable image optimization for better performance,
                      but keep quality settings high (85-95%) for product images.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookmarkIcon className="h-5 w-5 mr-2" />
                  Monitoring and Logs
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Track migration progress and troubleshoot issues using the built-in monitoring:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 ml-6">
                    <li>• <strong>Dashboard:</strong> Real-time statistics and system status</li>
                    <li>• <strong>Logs:</strong> Detailed history of all migration operations</li>
                    <li>• <strong>Conflicts:</strong> List of unresolved data conflicts</li>
                    <li>• <strong>Settings:</strong> Configuration and connection status</li>
                  </ul>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Best Practice:</strong> Review migration logs regularly to ensure
                      data integrity and identify potential issues early.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
              <p className="text-gray-600 mb-6">
                Common issues and solutions for migration system problems.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Connection Issues
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">"API request failed: 404"</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Cause:</strong> Legacy system API endpoint not accessible</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Verify legacy system URL is correct and accessible</li>
                        <li>Check if legacy system migration routes are registered</li>
                        <li>Ensure legacy system server is running</li>
                        <li>Validate API token in legacy system .env file</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">"Connection timeout"</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Cause:</strong> Network connectivity or server response issues</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Check network connectivity between systems</li>
                        <li>Verify firewall settings allow API access</li>
                        <li>Increase timeout settings if needed</li>
                        <li>Check legacy system server performance</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">"Authentication failed"</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Cause:</strong> Invalid or missing API token</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Regenerate API token in legacy system</li>
                        <li>Update token in v2 migration settings</li>
                        <li>Ensure token is exactly 64 characters</li>
                        <li>Check for extra spaces or special characters</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Performance Issues
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Slow Migration Speed</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Causes:</strong> Large datasets, network latency, server resources</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Reduce batch size in migration settings</li>
                        <li>Run migrations during off-peak hours</li>
                        <li>Use incremental sync instead of full migration</li>
                        <li>Check server resource utilization</li>
                        <li>Optimize database indexes on migration tables</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Memory Issues</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Cause:</strong> Processing too much data at once</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Decrease batch size (try 50-100 records)</li>
                        <li>Increase PHP memory limit</li>
                        <li>Enable image optimization to reduce memory usage</li>
                        <li>Process entities separately instead of all at once</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Data Issues
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">High Conflict Rate</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Cause:</strong> Data exists in both systems with differences</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Review conflict resolution strategy</li>
                        <li>Use "Old System Priority" for initial migration</li>
                        <li>Manually resolve critical conflicts</li>
                        <li>Consider data cleanup before migration</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Missing Images</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Causes:</strong> Invalid URLs, network issues, file permissions</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Check image URLs in legacy system</li>
                        <li>Verify storage directory permissions</li>
                        <li>Ensure sufficient disk space</li>
                        <li>Review migration logs for specific error messages</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Validation Errors</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><strong>Cause:</strong> Data doesn't meet v2 system requirements</p>
                      <p className="text-sm text-gray-600"><strong>Solutions:</strong></p>
                      <ul className="text-sm text-gray-600 ml-6 list-disc">
                        <li>Review specific validation rules in v2 system</li>
                        <li>Update data transformation logic if needed</li>
                        <li>Handle missing required fields in migration service</li>
                        <li>Check for data type mismatches</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                  Getting Help
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    If you encounter issues not covered here:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• Check migration logs for detailed error messages</li>
                    <li>• Review Laravel logs in <code className="bg-gray-100 px-1 py-0.5 rounded">storage/logs/laravel.log</code></li>
                    <li>• Test with smaller datasets first</li>
                    <li>Contact support with specific error details and logs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">API Reference</h2>
              <p className="text-gray-600 mb-6">
                Complete API documentation for the migration system endpoints.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    All API endpoints require authentication using Laravel Sanctum tokens:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
{`Authorization: Bearer your-api-token
Content-Type: application/json`}</pre>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoints</h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">GET /api/v1/admin/migration/dashboard</h4>
                      <p className="text-sm text-gray-600 mb-2">Get migration dashboard data and statistics</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <pre className="text-xs">
{`{
  "success": true,
  "data": {
    "status": { "legacy_available": true, "legacy_version": "1.0.0" },
    "statistics": { "total_migrations": 5, "successful_migrations": 4 },
    "entity_counts": { "legacy": { "products": 1000 }, "v2": { "products": 800 } }
  }
}`}</pre>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">POST /api/v1/admin/migration/test-connection</h4>
                      <p className="text-sm text-gray-600 mb-2">Test connection to legacy system</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <pre className="text-xs">
{`{
  "success": true,
  "data": {
    "success": true,
    "message": "Connection successful",
    "data": { "version": "1.0.0", "status": "online" }
  }
}`}</pre>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">POST /api/v1/admin/migration/preview</h4>
                      <p className="text-sm text-gray-600 mb-2">Preview migration data without making changes</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Request:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto mb-2">
                          <pre className="text-xs">{`{ "entities": ["categories", "products", "product_images"] }`}</pre>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <pre className="text-xs">
{`{
  "success": true,
  "data": {
    "categories": { "legacy_count": 50, "v2_count": 45, "will_migrate": 5 },
    "products": { "legacy_count": 1000, "v2_count": 800, "will_migrate": 200 }
  }
}`}</pre>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">POST /api/v1/admin/migration/full-migration</h4>
                      <p className="text-sm text-gray-600 mb-2">Run full migration from legacy system</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Request:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto mb-2">
                          <pre className="text-xs">{`{ "entities": ["categories", "products"] }`}</pre>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <pre className="text-xs">
{`{
  "success": true,
  "data": {
    "migration_log_id": 123,
    "records_processed": 1050,
    "records_created": 250,
    "records_updated": 800,
    "duration": 45
  }
}`}</pre>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">POST /api/v1/admin/migration/incremental-sync</h4>
                      <p className="text-sm text-gray-600 mb-2">Run incremental sync for new/updated data</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <pre className="text-xs">
{`{
  "success": true,
  "data": {
    "migration_log_id": 124,
    "records_processed": 25,
    "records_created": 10,
    "records_updated": 15,
    "duration": 12
  }
}`}</pre>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">GET /api/v1/admin/migration/logs</h4>
                      <p className="text-sm text-gray-600 mb-2">Get migration logs with filtering</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Query Parameters:</p>
                        <ul className="text-sm text-gray-600 ml-4 mb-2">
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">status</code> - Filter by status (completed, failed, running)</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">migration_type</code> - Filter by type (full_migration, incremental_sync)</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">page</code> - Page number for pagination</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">per_page</code> - Records per page (max: 100)</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">GET /api/v1/admin/migration/conflicts</h4>
                      <p className="text-sm text-gray-600 mb-2">Get migration conflicts with filtering</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Query Parameters:</p>
                        <ul className="text-sm text-gray-600 ml-4">
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">resolved</code> - Filter by resolution status (true/false)</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">entity_type</code> - Filter by entity type</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">conflict_type</code> - Filter by conflict type</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">POST /api/v1/admin/migration/conflicts/{'{conflictId}'}/resolve</h4>
                      <p className="text-sm text-gray-600 mb-2">Resolve a specific migration conflict</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Request:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <pre className="text-xs">
{`{
  "resolution": "old_system_priority",
  "resolution_notes": "Keeping legacy data as per business requirements"
}`}</pre>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mt-2 mb-1">Resolution Options:</p>
                        <ul className="text-sm text-gray-600 ml-4">
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">old_system_priority</code> - Use legacy data</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">new_system_priority</code> - Use v2 data</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">skip</code> - Skip this record</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">manual</code> - Manual resolution required</li>
                          <li>• <code className="bg-gray-100 px-1 py-0.5 rounded">merge</code> - Merge both datasets</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">GET /api/v1/admin/migration/settings</h4>
                      <p className="text-sm text-gray-600 mb-2">Get current migration settings</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">PUT /api/v1/admin/migration/settings</h4>
                      <p className="text-sm text-gray-600 mb-2">Update migration settings</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Request:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <pre className="text-xs">
{`{
  "settings": {
    "legacy_system_url": "https://legacy.example.com",
    "legacy_system_token": "your-secure-token",
    "auto_sync_enabled": true,
    "auto_sync_interval": 30,
    "conflict_resolution": "old_system_priority",
    "max_batch_size": 100
  }
}`}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Console Commands</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">php artisan migration:full</h4>
                    <p className="text-sm text-gray-600 mb-2">Run full migration from command line</p>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto mb-2">
                        <pre className="text-xs">
{`# Basic usage
php artisan migration:full

# With options
php artisan migration:full --entities=categories,products --batch-size=50

# Preview mode
php artisan migration:full --preview

# Force run (skip recent check)
php artisan migration:full --force`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">php artisan migration:sync</h4>
                    <p className="text-sm text-gray-600 mb-2">Run incremental sync from command line</p>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                        <pre className="text-xs">
{`# Basic usage
php artisan migration:sync

# With specific entities
php artisan migration:sync --entities=products

# Force run (ignore auto-sync setting)
php artisan migration:sync --force

# Custom batch size
php artisan migration:sync --batch-size=25`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Migration Documentation</h1>
        <p className="mt-2 text-gray-600">
          Complete guide for setting up and using the BookBharat migration system
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700 border-blue-200 border'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <section.icon className="h-5 w-5 mr-3" />
                {section.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Start</h3>
            <p className="text-xs text-blue-700 mb-3">
              New to migration? Follow our setup guide to get started quickly.
            </p>
            <button
              onClick={() => setActiveSection('setup')}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="prose prose-lg max-w-none">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationDocumentation;