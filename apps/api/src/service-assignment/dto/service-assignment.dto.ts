export class ServiceAssignmentResponseDto {
  readonly organizationId!: string;
  readonly userId!: string;
  readonly serviceId!: string;
  readonly createdAt!: Date;

  constructor(record: ServiceAssignmentResponseDto) {
    this.organizationId = record.organizationId;
    this.userId = record.userId;
    this.serviceId = record.serviceId;
    this.createdAt = record.createdAt;
  }
}
