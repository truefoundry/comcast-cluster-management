import { useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import routes from './routes';

const AppRoutes = () => {
  const routesConfig: RouteObject[] = routes;

  const Routes = useRoutes([...routesConfig]);

  return Routes;
};

export default AppRoutes;
