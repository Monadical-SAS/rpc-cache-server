import http from "http";
import https from "https";

export const DESTROY_TIMEOUT_MS = 5000;

export class AgentManager {
  _agent: http.Agent | https.Agent;
  _activeRequests = 0;
  _destroyTimeout: ReturnType<typeof setTimeout> | null = null;
  _useHttps: boolean;

  static _newAgent(useHttps: boolean): http.Agent | https.Agent {
    const options = { keepAlive: true, maxSockets: 25 };
    if (useHttps) {
      return new https.Agent(options);
    } else {
      return new http.Agent(options);
    }
  }

  constructor(useHttps?: boolean) {
    this._useHttps = useHttps === true;
    this._agent = AgentManager._newAgent(this._useHttps);
  }

  requestStart(): http.Agent | https.Agent {
    this._activeRequests++;
    if (this._destroyTimeout !== null) {
      clearTimeout(this._destroyTimeout);
      this._destroyTimeout = null;
    }
    return this._agent;
  }

  requestEnd(): void {
    this._activeRequests--;
    if (this._activeRequests === 0 && this._destroyTimeout === null) {
      this._destroyTimeout = setTimeout(() => {
        this._agent.destroy();
        this._agent = AgentManager._newAgent(this._useHttps);
      }, DESTROY_TIMEOUT_MS);
    }
  }
}
