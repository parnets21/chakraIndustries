import TasksPage from './TasksPage';
const TAB_MAP = { kanban: 0, todo: 1, recurring: 2, notifs: 3 };
export default function TasksSubPage({ tab }) {
  return <TasksPage initialTab={TAB_MAP[tab] ?? 0} />;
}
