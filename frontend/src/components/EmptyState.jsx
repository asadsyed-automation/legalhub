import PropTypes from 'prop-types';
import { DocumentIcon } from './Icons';
import './EmptyState.css';

export const EmptyState = ({
  icon = <DocumentIcon size={40} color="var(--color-text-subtle)" />,
  title = 'No records found',
  description = 'There is currently no data to display here.',
  action = null,
}) => {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon-box" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
};

export default EmptyState;
