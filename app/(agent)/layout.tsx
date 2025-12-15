import AgentLayout from '@/components/layouts/AgentLayout'

export default function AgentLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <AgentLayout>{children}</AgentLayout>
}

