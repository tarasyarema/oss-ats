'use client';

import CandidatesTable from "@/app/components/tables/CandidatesTable";
import { JobView } from "@/types";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Flex, Splitter, Typography } from "antd";
import { useParams, useRouter } from 'next/navigation'


export default function Page(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const jobId = params.id;

  const {
    data: job,
    isLoading,
  } = useQuery<JobView>({
    queryKey: ['jobs', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }
      return response.json();
    },
  })

  if (isLoading) {
    return <Typography.Text>Loading...</Typography.Text>
  }

  if (!job) {
    return <Typography.Text>Job not found</Typography.Text>
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
          {job.title}
        </Typography.Title>
      </Flex>
      <Splitter>
        <Splitter.Panel defaultSize="60%" min="40%" max="80%" style={{ paddingRight: 10 }}>
          <Flex vertical>
            <Typography.Title level={5}>
              Candidates
            </Typography.Title>
            <CandidatesTable
              jobId={job.id}
            />
          </Flex>
        </Splitter.Panel>
        <Splitter.Panel style={{ paddingLeft: 10 }}>
          <Flex gap={20} vertical>
            <Flex gap={1} vertical align="flex-start">
              <Typography.Title level={5}>
                LinkedIn URL
              </Typography.Title>
              {!!job.linkedinUrl ? (
                <Typography.Link href={job.linkedinUrl} target="_blank" copyable>
                  {job.linkedinUrl}
                </Typography.Link>
              ) : (
                <Typography.Text>
                  Not provided
                </Typography.Text>
              )}
            </Flex>
            <Flex gap={1} vertical align="flex-start">
              <Typography.Title level={5}>
                Description
              </Typography.Title>
              {!job.description && <Typography.Text>Not provided</Typography.Text>}
              <Flex gap={4} vertical align="flex-start">
                {job.description && (
                  job.description.split('\n').map((line, index) => (
                    <Typography.Text key={index}>
                      {line}
                    </Typography.Text>
                  )
                  ))}
              </Flex>
            </Flex>
          </Flex>
        </Splitter.Panel>
      </Splitter>
    </Flex >
  )
}
