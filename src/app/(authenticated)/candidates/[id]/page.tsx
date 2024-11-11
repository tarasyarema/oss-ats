'use client';

import ProcessStepsTable from "@/app/components/tables/ProcessStepsTable";
import { CandidateView, ProcessStepTemplate } from "@/types";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, Flex, Input, Select, Splitter, Table, Typography } from "antd";
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from "react";
import { debounce } from 'lodash';
import RatingTag from "@/app/components/RatingTag";
import { Editor } from "@/app/components/Editor";


type UpdateStepArgs = {
  id: string;
  data: any;
}

export default function Page(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [selectedStep, setSelectedStep] = useState<ProcessStepTemplate | null>(null);
  const qc = useQueryClient();

  const [notes, setNotes] = useState<string | undefined>();

  const canId = params.id;

  const {
    data: candidate,
    isLoading,
  } = useQuery<CandidateView>({
    queryKey: ['candidates', canId],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${canId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch candidate');
      }
      return response.json();
    },
  })

  const {
    mutate: updateStep,
    isPending: updatePending,
  } = useMutation({
    mutationFn: async (body: UpdateStepArgs) => {
      const response = await fetch(`/api/process-steps/${body.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body.data),
      });
      if (!response.ok) {
        throw new Error('Failed to update process step');
      }
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    }
  })


  const debouncedUpdateStep = useCallback(
    debounce((id: string, notes: string) => {
      updateStep({
        id,
        data: { notes }
      });
    }, 400),
    [updateStep]
  );

  useEffect(() => {
    if (!!candidate && !selectedStep) {
      setSelectedStep(candidate.currentStep.template);
    }
  }, [candidate, candidate?.currentStep.templateId, selectedStep]);

  const handleTemplateSelect = (temp: ProcessStepTemplate) => {
    setSelectedStep(temp);
    qc.invalidateQueries({ queryKey: ['candidates', canId] });
  }

  const selectedCanStep = candidate?.steps?.find(step => step.templateId === selectedStep?.id);

  useEffect(() => {
    if (selectedCanStep) {
      setNotes(selectedCanStep.notes || undefined);
    }
  }, [selectedCanStep]);

  if (isLoading) {
    return <Typography.Text>Loading...</Typography.Text>
  }

  if (!candidate) {
    return <Typography.Text>Candidate not found</Typography.Text>
  }

  return (
    <Flex gap="middle" vertical>
      <Flex
        justify="flex-start"
        gap={10}
      >
        <Button
          type="dashed"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography.Title level={3}>
          {candidate.persona.name} - {candidate.job.title}
        </Typography.Title>
      </Flex>

      <Flex vertical>
        <Splitter>
          <Splitter.Panel defaultSize="50%" min="40%" max="70%" style={{ paddingRight: 10 }}>
            <Flex gap="middle" vertical>
              <Flex vertical>
                <Typography.Title level={4}>
                  Information
                </Typography.Title>
                <Table
                  dataSource={[candidate]}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'Name',
                      key: 'name',
                      render: (record: CandidateView) => `${record.persona.name} ${record.persona.surname}`,
                    },
                    {
                      title: 'Email',
                      key: 'email',
                      render: (record: CandidateView) => (
                        <Typography.Link href={`mailto:${record.persona.email}`} copyable>
                          {record.persona.email}
                        </Typography.Link>
                      ),
                      ellipsis: true,
                    },
                    {
                      title: 'Final Rating',
                      key: 'rating',
                      render: (record: CandidateView) => {
                        return <RatingTag rating={record.rating} />;
                      },
                    },
                    {
                      title: 'Source',
                      dataIndex: 'source',
                      key: 'source',
                    },
                  ]}
                />
              </Flex>
              <Flex vertical>
                <Typography.Title level={4}>
                  Process Steps
                </Typography.Title>
                <ProcessStepsTable
                  candidateId={canId}
                  templateSelected={selectedStep || undefined}
                  onTemplateSelect={handleTemplateSelect}
                />
              </Flex>
            </Flex>
          </Splitter.Panel>
          <Splitter.Panel>
            <Flex gap="middle" vertical style={{ paddingLeft: 10 }}>
              <Typography.Title level={4}>
                Step #{selectedStep?.order}: {selectedStep?.name}
              </Typography.Title>
              {selectedStep && (
                <Flex gap={20} vertical>
                  <Flex gap="large" justify="flex-start" align="flex-start">
                    <Flex gap={1} vertical align="flex-start">
                      <Typography.Title level={5}>
                        Rating
                      </Typography.Title>
                      {selectedCanStep && (
                        <Select
                          placeholder="Select a rating"
                          style={{ minWidth: '180px' }}
                          defaultValue={selectedCanStep?.rating}
                          disabled={updatePending}
                          loading={updatePending}
                          onSelect={(value) => {
                            updateStep({
                              id: selectedCanStep.id,
                              data: {
                                rating: value,
                              }
                            });
                          }}
                          options={[
                            { value: 'Strong no hire', label: 'Strong no hire' },
                            { value: 'No hire', label: 'No hire' },
                            { value: 'Maybe', label: 'Maybe' },
                            { value: 'Hire', label: 'Hire' },
                            { value: 'Strong hire', label: 'Strong hire' },
                          ]}
                        />
                      )}
                    </Flex>
                    <Flex gap={1} vertical align="flex-start">
                      <Typography.Title level={5}>
                        Date
                      </Typography.Title>
                      {selectedCanStep && (
                        <DatePicker
                          placeholder="Select the date"
                          style={{ minWidth: '180px' }}
                          disabled={updatePending}
                          onChange={(date) => {
                            updateStep({
                              id: selectedCanStep.id,
                              data: {
                                date,
                              }
                            });
                          }}
                        />
                      )}
                    </Flex>
                  </Flex>
                  <Flex gap={2} vertical>
                    <Flex justify="space-between" align="center">
                      <Typography.Title level={5}>
                        Notes
                      </Typography.Title>
                      {updatePending && (
                        <Typography.Text type="secondary">
                          Saving...
                        </Typography.Text>
                      )}
                    </Flex>
                    {!selectedCanStep && (
                      <Typography.Text type="secondary">
                        Notes will be displayed here once the candidate is in this step
                      </Typography.Text>
                    )}
                    {!!selectedCanStep && (
                      <Input.TextArea
                        rows={24}
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          debouncedUpdateStep(selectedCanStep.id, e.target.value);
                        }}
                      />
                    )}
                    {!!selectedCanStep && (
                      <Editor
                        markdown={notes || ""}
                        onChange={(value) => {
                          setNotes(value);
                          debouncedUpdateStep(selectedCanStep.id, value);
                        }}
                      />
                    )}
                    {!!selectedCanStep && (
                      <Flex justify="end">
                        <Button
                          type="primary"
                          disabled={updatePending}
                          onClick={() => {
                            updateStep({
                              id: selectedCanStep.id,
                              data: {
                                status: 'Completed',
                              }
                            });
                          }}
                        >
                          Save
                        </Button>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Splitter.Panel>
        </Splitter>
      </Flex>
    </Flex>
  )
}
