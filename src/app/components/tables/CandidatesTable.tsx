'use client';

import React from 'react';
import { Table, Button, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { CandidateView } from '@/types';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CandidatesTableProps {
  jobId?: string;
  loading?: boolean;
  onEdit?: (candidate: CandidateView) => void;
  onDelete?: (candidate: CandidateView) => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ jobId, loading, onEdit, onDelete }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: fetchedCandidates, isLoading } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: async () => {
      const url = `/api/candidates${jobId ? `?jobId=${jobId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }
      return response.json();
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete candidate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      message.success('Candidate deleted successfully');
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to delete candidate');
    },
  });

  const handleRowClick = (record: CandidateView) => {
    router.push(`/candidates/${record.id}`);
  };

  const columns: ColumnsType<CandidateView> = [
    {
      title: 'Name',
      key: 'name',
      render: (record) => record.persona.name,
      sorter: (a, b) => a.persona.name.localeCompare(b.persona.name),
    },
    {
      title: 'Email',
      key: 'email',
      render: (record) => record.persona.email,
    },
    ...(!jobId ?
      [
        {
          title: 'Job',
          key: 'jobTitle',
          render: (record: CandidateView) => record.job.title,
        },
      ] : []
    ),
    {
      title: 'CV',
      key: 'cvUrl',
      render: (record) => {
        return <CVButton id={record.id} />
      }
    },
    {
      title: 'Step',
      key: 'step',
      render: (record: CandidateView) => {
        const steps = record.steps;

        if (!steps || steps.length === 0) {
          return 'No steps';
        }

        const lastStep = steps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).pop();

        if (!lastStep) {
          return 'No steps';
        }

        return (
          <span>
            {lastStep.type} - {lastStep.status}
          </span>
        )
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        if (typeof window === 'undefined') return date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => {
        if (typeof window === 'undefined') return date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleRowClick(record)}
          />
          {onEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
            />
          )}
          {onDelete && (
            <Popconfirm
              title="Delete candidate"
              description="Are you sure?"
              onConfirm={() => onDelete?.(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={fetchedCandidates || []}
      columns={columns}
      rowKey="id"
      loading={loading || isLoading || deleteCandidateMutation.isPending}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} candidates`,
      }}
    />
  );
};

const CVButton = ({ id }: { id: string }) => {
  const {
    data: url,
    isLoading,
  } = useQuery<{ url: string | null }>({
    queryKey: ['candidates', id, "cv"],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${id}/cv`);
      if (!response.ok) {
        throw new Error('Failed to fetch CV');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (!url?.url) {
    return <span>No CV</span>;
  }

  return (
    <a href={url.url} target="_blank" rel="noreferrer">
      CV
    </a>
  )
}

export default CandidatesTable;
