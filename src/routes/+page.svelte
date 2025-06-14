<div style="padding: 1rem;">
  <!-- Page Header -->
  <div style="margin-bottom: 2rem;">
    <h1
      style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 0.25rem;"
    >
      Dashboard
    </h1>
    <p style="color: #6b7280;">Overview of your Docker environment</p>
  </div>

  <!-- Simple Dashboard Content -->
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Stats Cards -->
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;"
    >
      <!-- Total Containers -->
      <div
        style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <div style="display: flex; align-items: center;">
          <div
            style="width: 2rem; height: 2rem; background-color: #3b82f6; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;"
          >
            <svg
              style="width: 1.25rem; height: 1.25rem; color: white;"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
              />
            </svg>
          </div>
          <div>
            <div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
              Total Containers
            </div>
            <div style="font-size: 1.125rem; font-weight: 600; color: #111827;">
              -
            </div>
          </div>
        </div>
      </div>

      <!-- Running Containers -->
      <div
        style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <div style="display: flex; align-items: center;">
          <div
            style="width: 2rem; height: 2rem; background-color: #10b981; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;"
          >
            <svg
              style="width: 1.25rem; height: 1.25rem; color: white;"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
              Running
            </div>
            <div style="font-size: 1.125rem; font-weight: 600; color: #10b981;">
              -
            </div>
          </div>
        </div>
      </div>

      <!-- Stopped Containers -->
      <div
        style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <div style="display: flex; align-items: center;">
          <div
            style="width: 2rem; height: 2rem; background-color: #6b7280; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;"
          >
            <svg
              style="width: 1.25rem; height: 1.25rem; color: white;"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 10h6v4H9z"
              />
            </svg>
          </div>
          <div>
            <div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
              Stopped
            </div>
            <div style="font-size: 1.125rem; font-weight: 600; color: #6b7280;">
              -
            </div>
          </div>
        </div>
      </div>

      <!-- Images -->
      <div
        style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <div style="display: flex; align-items: center;">
          <div
            style="width: 2rem; height: 2rem; background-color: #8b5cf6; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;"
          >
            <svg
              style="width: 1.25rem; height: 1.25rem; color: white;"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
              Images
            </div>
            <div style="font-size: 1.125rem; font-weight: 600; color: #111827;">
              -
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div
      style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
    >
      <h3
        style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;"
      >
        Quick Actions
      </h3>
      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;"
      >
        <a
          href="/containers"
          style="display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500;"
        >
          <svg
            style="width: 1rem; height: 1rem; margin-right: 0.5rem;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
            />
          </svg>
          View Containers
        </a>

        <a
          href="/images"
          style="display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500;"
        >
          <svg
            style="width: 1rem; height: 1rem; margin-right: 0.5rem;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Manage Images
        </a>

        <a
          href="/networks"
          style="display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500;"
        >
          <svg
            style="width: 1rem; height: 1rem; margin-right: 0.5rem;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 12a9 9 0 01-2.219 5.781M15.219 7.219A9 9 0 0115.219 7.219M3 12a9 9 0 012.219-5.781m0 11.562A9 9 0 013 12m6 0a3 3 0 106 0 3 3 0 00-6 0zm6 0a3 3 0 106 0 3 3 0 00-6 0z"
            />
          </svg>
          View Networks
        </a>

        <a
          href="/volumes"
          style="display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500;"
        >
          <svg
            style="width: 1rem; height: 1rem; margin-right: 0.5rem;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          </svg>
          Manage Volumes
        </a>
      </div>
    </div>

    <!-- Connection Status -->
    <div
      style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.375rem; padding: 1rem;"
    >
      <div style="display: flex;">
        <div style="flex-shrink: 0;">
          <svg
            style="height: 1.25rem; width: 1.25rem; color: #f59e0b;"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div style="margin-left: 0.75rem;">
          <h3
            style="font-size: 0.875rem; font-weight: 600; color: #92400e; margin-bottom: 0.5rem;"
          >
            Docker Connection Required
          </h3>
          <p style="font-size: 0.875rem; color: #b45309;">
            This is a simplified version. Full Docker functionality will be
            available once the backend is connected.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  a:hover {
    background-color: #f3f4f6 !important;
  }
</style>
