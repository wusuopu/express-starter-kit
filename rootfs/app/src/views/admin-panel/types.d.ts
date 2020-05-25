type Resource = {
  id: string;
  name: string;
  href: string;
}
export type StoreProps = {
  store: {
    paths: {
      loginPath: string;
      logoutPath: string;
      rootPath: string;
    }
    resources: Resource[];
  }
}
