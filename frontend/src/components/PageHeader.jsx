import PropTypes from 'prop-types';
import './PageHeader.css';

export const PageHeader = ({
  title,
  subtitle = null,
  badge = null,
  actions = null,
  breadcrumbs = null,
}) => {
  return (
    <header className="page-header">
      {breadcrumbs && <nav className="page-header__breadcrumbs">{breadcrumbs}</nav>}

      <div className="page-header__main">
        <div className="page-header__titles">
          <div className="page-header__title-row">
            <h1 className="page-header__title">{title}</h1>
            {badge && <div className="page-header__badge">{badge}</div>}
          </div>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>

        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </header>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  badge: PropTypes.node,
  actions: PropTypes.node,
  breadcrumbs: PropTypes.node,
};

export default PageHeader;
