export class ServiceAssignmentResponseDto {
  readonly organizationId!: string;
  readonly userId!: string;
  readonly serviceId!: string;
  readonly createdAt!: Date;

  constructor(record: ServiceAssignmentResponseDto) {
    Object.assign(this, record);
  }
}
