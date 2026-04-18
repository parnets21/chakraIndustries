import TasksPage from './TasksPage';
const TAB_MAP = { kanban: 0, todo: 1, notifs: 2 };
export default function TasksSubPage({ tab }) {
  return <TasksPage initialTab={TAB_MAP[tab] ?? 0} />;
}
