import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationApi } from '../../services/communicationApi';
import { CommunicationTemplate } from '../../types/communication';
import { Edit2, Trash2, CheckCircle, XCircle, Plus, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const CommunicationTemplates = () => {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  // Fetch Templates
  const { data, isLoading } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: () => communicationApi.getTemplates()
  });

  const templatesGrouped = data?.data?.data || {};

  // Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => communicationApi.toggleTemplateActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['communication-templates']);
      toast.success('Template status updated');
    },
    onError: () => toast.error('Failed to update template status')
  });

  const channels = ['email', 'sms', 'whatsapp', 'push'];

  const filteredGroups = selectedChannel === 'all' 
    ? templatesGrouped 
    : { [selectedChannel]: templatesGrouped[selectedChannel] || [] };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Communication Templates</h1>
          <p className="text-gray-500">Manage your email, SMS, and WhatsApp templates</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`px-4 py-2 font-medium ${selectedChannel === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setSelectedChannel('all')}
        >
          All Channels
        </button>
        {channels.map(channel => (
          <button 
            key={channel}
            className={`px-4 py-2 font-medium capitalize ${selectedChannel === channel ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setSelectedChannel(channel)}
          >
            {channel}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading templates...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredGroups).map(([channel, templates]) => (
            templates && templates.length > 0 && (
              <div key={channel}>
                <h3 className="text-lg font-semibold capitalize mb-3 text-gray-700 flex items-center gap-2">
                  <span className={`w-2 h-6 rounded ${
                    channel === 'email' ? 'bg-blue-500' : 
                    channel === 'sms' ? 'bg-green-500' : 
                    channel === 'whatsapp' ? 'bg-green-600' : 'bg-purple-500'
                  }`}></span>
                  {channel} Templates
                </h3>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Name / Slug</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Subject / Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {templates.map((template: CommunicationTemplate) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{template.name}</div>
                            <div className="text-xs text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                              {template.slug}
                              <Copy className="w-3 h-3 cursor-pointer hover:text-blue-500" onClick={() => {
                                navigator.clipboard.writeText(template.slug);
                                toast.success('Slug copied');
                              }}/>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{template.subject || '-'}</div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1 capitalize">
                              {template.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                             {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => toggleActiveMutation.mutate(template.id)}
                              className={`flex items-center gap-1 text-sm ${template.is_active ? 'text-green-600' : 'text-gray-400'}`}
                            >
                              {template.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              {template.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ))}
          
          {Object.keys(filteredGroups).length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
              No templates found for this channel.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunicationTemplates;
