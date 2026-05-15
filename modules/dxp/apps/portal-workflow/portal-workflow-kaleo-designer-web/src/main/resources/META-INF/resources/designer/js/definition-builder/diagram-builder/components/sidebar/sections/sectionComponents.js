import EdgeInformation from './EdgeInformation';
import NodeInformation from './NodeInformation';
import Actions from './actions/Actions';
import ActionsSummary from './actions/ActionsSummary';
import AITaskSummary from './ai-task/AITaskSummary';
import Assignments from './assignments/Assignments';
import AssignmentsSummary from './assignments/AssignmentsSummary';
import InputMappingsSummary from './ai-task/InputMappingsSummary';
import Notifications from './notifications/Notifications';
import NotificationsSummary from './notifications/NotificationsSummary';
import OutputMappingsSummary from './ai-task/OutputMappingsSummary';
import PromptSummary from './prompt/PromptSummary';
import RAGSummary from './rag/RAGSummary';
import SourceCode from './assignments/SourceCode';
import TimerSourceCode from './timers/TimerSourceCode';
import Timers from './timers/Timers';
import TimersSummary from './timers/TimersSummary';
import ToolsSummary from './tools/ToolsSummary';

const sectionComponents = {
	actions: Actions,
	actionsSummary: ActionsSummary,
	aiTaskSummary: AITaskSummary,
	assignments: Assignments,
	assignmentsSummary: AssignmentsSummary,
	edgeInformation: EdgeInformation,
	inputMappingsSummary: InputMappingsSummary,
	nodeInformation: NodeInformation,
	notifications: Notifications,
	notificationsSummary: NotificationsSummary,
	outputMappingsSummary: OutputMappingsSummary,
	promptSummary: PromptSummary,
	ragSummary: RAGSummary,
	sourceCode: SourceCode,
	timerSourceCode: TimerSourceCode,
	timers: Timers,
	timersSummary: TimersSummary,
	toolsSummary: ToolsSummary,
};

export default sectionComponents;