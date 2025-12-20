# Stubs

This directory contains stub files that are used to replace dependencies on the `frontend_reference` directory during the mobile build process. This is necessary to create a clean, mobile-only build that does not include any web-only code.

The stubs provide the minimal necessary types and values that the mobile code expects to be present, without including the full implementation from the `frontend_reference` directory.

When adding new stubs, please ensure that they are as minimal as possible and that they are well-documented to explain their purpose.
