const getFullName = (
  firstName: string,
  middleName: string | null,
  lastName: string
) => {
  let fullName = firstName;
  if (middleName) {
    fullName += ` ${middleName}`;
  }
  if (lastName) {
    fullName += ` ${lastName}`;
  }
  return fullName;
};

export default getFullName;
